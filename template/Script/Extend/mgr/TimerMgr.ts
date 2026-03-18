// @FilePath: TimerMgr.ts
/*
 * @Author: yyd
 * @Description: 统一调度管理器 - 优化大量 schedule 的性能问题
 */

/** 定时器目标类型（支持生命周期检查） */
type TimerTarget = { isValid?: boolean } | null

interface ITimerTask {
    id: symbol
    callback: (dt: number) => void
    interval: number
    elapsed: number
    delay: number
    repeat: number
    target: TimerTarget
    paused: boolean
}

/**
 * 统一调度管理器
 * 用单个 update 管理所有定时任务，避免大量 schedule 的性能问题
 * 
 * @example
 * ```typescript
 * // 注册定时任务（类似 schedule）
 * const id = $app.timer.schedule(this, (dt) => {
 *     console.log("每 0.5 秒执行", dt)
 * }, 0.5)
 * 
 * // 注册一次性延迟任务（类似 scheduleOnce）
 * $app.timer.scheduleOnce(this, () => {
 *     console.log("2 秒后执行")
 * }, 2)
 * 
 * // 取消任务
 * $app.timer.unschedule(id)
 * 
 * // 取消目标的所有任务
 * $app.timer.unscheduleAllForTarget(this)
 * 
 * // 暂停/恢复目标的所有任务
 * $app.timer.pauseTarget(this)
 * $app.timer.resumeTarget(this)
 * ```
 */
@$gb.Identifiable
class _TimerMgr {
    // Cocos Scheduler 需要 target 有 _id 属性
    private _id = "TimerMgr"

    private _tasks: Map<symbol, ITimerTask> = new Map()
    private _targetTasks: WeakMap<any, Set<symbol>> = new WeakMap()
    private _keyedTasks: Map<string | symbol, symbol> = new Map()
    private _isRunning = false
    private _toRemove: symbol[] = []

    /**
     * 注册定时任务
     * @param target 目标对象（用于分组管理）
     * @param callback 回调函数
     * @param interval 间隔时间（秒），0 表示每帧
     * @param repeat 重复次数，默认无限
     * @param delay 首次执行延迟（秒）
     * @returns 任务 ID（用于取消）
     */
    schedule(
        target: TimerTarget,
        callback: (dt: number) => void,
        interval: number = 0,
        repeat: number = Infinity,
        delay: number = 0
    ): symbol {
        const id = Symbol()
        const task: ITimerTask = { id, callback, interval, elapsed: -delay, delay, repeat, target, paused: false }
        this._tasks.set(id, task)
        this._addToTarget(target, id)
        this._ensureUpdate()

        return id
    }

    /**
     * 注册一次性延迟任务
     * @param target 目标对象
     * @param callback 回调函数
     * @param delay 延迟时间（秒）
     * @returns 任务 ID
     */
    scheduleOnce(target: TimerTarget, callback: () => void, delay: number = 0): symbol {
        return this.schedule(target, callback, 0, 1, delay)
    }

    // ============ 基于 Key 的调度方法 ============

    /**
     * 按 key 注册定时任务（防重复调度）
     * @param key 任务唯一标识
     * @param callback 回调函数
     * @param interval 间隔时间（秒），0 表示下一帧
     * @param isOnce 是否只执行一次（默认 false）
     * @returns 是否成功注册（false 表示 key 已存在）
     * @example
     * ```typescript
     * // 注册定时任务
     * $app.timer.scheduleByKey("MyClass_update", () => {
     *     console.log("每 0.5 秒执行")
     * }, 0.5)
     * 
     * // 一次性任务
     * $app.timer.scheduleByKey("MyClass_delay", () => {
     *     console.log("2 秒后执行")
     * }, 2, true)
     * 
     * // 取消
     * $app.timer.unscheduleByKey("MyClass_update")
     * ```
     */
    scheduleByKey(key: string | symbol, callback: () => void, interval: number = 0, isOnce: boolean = false): boolean {
        if (this._keyedTasks.has(key)) {
            clog.view(`TimerMgr: key "${String(key)}" 已存在，不重复调度`)
            return false
        }

        const repeat = isOnce ? 1 : Infinity
        const id = this.schedule(null, callback, interval, repeat, 0)
        this._keyedTasks.set(key, id)

        // 如果是一次性任务，执行后自动清除 key
        if (isOnce) {
            const originalTask = this._tasks.get(id)
            if (originalTask) {
                const originalCallback = originalTask.callback
                originalTask.callback = (dt) => {
                    originalCallback(dt)
                    this._keyedTasks.delete(key)
                }
            }
        }

        return true
    }

    /**
     * 按 key 注册一次性延迟任务
     * @param key 任务唯一标识
     * @param callback 回调函数
     * @param delay 延迟时间（秒）
     * @returns 是否成功注册
     */
    scheduleOnceByKey(key: string | symbol, callback: () => void, delay: number = 0): boolean {
        return this.scheduleByKey(key, callback, delay, true)
    }

    /**
     * 按 key 取消任务
     * @param key 任务标识
     * @returns 是否成功取消
     */
    unscheduleByKey(key: string | symbol): boolean {
        const id = this._keyedTasks.get(key)
        if (id) {
            this.unschedule(id)
            this._keyedTasks.delete(key)
            return true
        }
        return false
    }

    /**
     * 判断 key 是否存在
     * @param key 任务标识
     */
    hasKey(key: string | symbol): boolean {
        return this._keyedTasks.has(key)
    }

    /**
     * 清除所有按 key 注册的任务
     */
    unscheduleAllKeys() {
        this._keyedTasks.forEach((id) => {
            this.unschedule(id)
        })
        this._keyedTasks.clear()
    }

    // ============ 基于 ID 的操作 ============

    /**
     * 取消指定任务
     * @param id 任务 ID
     */
    unschedule(id: symbol) {
        const task = this._tasks.get(id)
        if (task) {
            this._removeFromTarget(task.target, id)
            this._tasks.delete(id)
        }
    }

    /**
     * 取消目标的所有任务
     * @param target 目标对象
     */
    unscheduleAllForTarget(target: TimerTarget) {
        const ids = this._targetTasks.get(target)
        if (ids) {
            ids.forEach(id => this._tasks.delete(id))
            this._targetTasks.delete(target)
        }
    }

    /**
     * 暂停目标的所有任务
     * @param target 目标对象
     */
    pauseTarget(target: TimerTarget) {
        this._setTargetPaused(target, true)
    }

    /**
     * 恢复目标的所有任务
     * @param target 目标对象
     */
    resumeTarget(target: TimerTarget) {
        this._setTargetPaused(target, false)
    }

    /**
     * 暂停指定任务
     * @param id 任务 ID
     */
    pause(id: symbol) {
        const task = this._tasks.get(id)
        if (task) task.paused = true
    }

    /**
     * 恢复指定任务
     * @param id 任务 ID
     */
    resume(id: symbol) {
        const task = this._tasks.get(id)
        if (task) task.paused = false
    }

    /**
     * 获取当前任务数量
     */
    get taskCount(): number {
        return this._tasks.size
    }

    /**
     * 判断任务是否存在
     * @param id 任务 ID
     * @returns 是否存在
     */
    has(id: symbol): boolean {
        return this._tasks.has(id)
    }

    /**
     * 判断目标是否有任务
     * @param target 目标对象
     * @returns 是否有任务
     */
    hasTarget(target: TimerTarget): boolean {
        const ids = this._targetTasks.get(target)
        return ids != null && ids.size > 0
    }

    /**
     * 清除所有任务
     */
    clear() {
        this._tasks.clear()
        this._targetTasks = new WeakMap()
        this._keyedTasks.clear()
    }

    // ============ 内部方法 ============

    private _addToTarget(target: TimerTarget, id: symbol) {
        if (target == null) return
        let ids = this._targetTasks.get(target)
        if (!ids) {
            ids = new Set()
            this._targetTasks.set(target, ids)
        }
        ids.add(id)
    }

    private _removeFromTarget(target: TimerTarget, id: symbol) {
        if (target == null) return
        const ids = this._targetTasks.get(target)
        if (ids) {
            ids.delete(id)
            if (ids.size === 0) {
                this._targetTasks.delete(target)
            }
        }
    }

    private _setTargetPaused(target: TimerTarget, paused: boolean) {
        if (target == null) return
        const ids = this._targetTasks.get(target)
        if (ids) {
            ids.forEach(id => {
                const task = this._tasks.get(id)
                if (task) task.paused = paused
            })
        }
    }

    private _ensureUpdate() {
        if (this._isRunning) return
        this._isRunning = true
        cc.director.getScheduler().scheduleUpdate(this, 0, false)
    }

    update(dt: number) {
        if (this._tasks.size === 0) return

        this._toRemove.length = 0

        this._tasks.forEach((task, id) => {
            if (task.paused) return

            // 检查 target 是否有效（cc.Component/cc.Node）
            if (task.target?.isValid === false) {
                this._toRemove.push(id)
                return
            }

            task.elapsed += dt

            if (task.elapsed >= task.interval) {
                task.elapsed = 0

                try {
                    task.callback.call(task.target, dt)
                } catch (e) {
                    clog.error(`TimerMgr callback error:`, e)
                }

                if (--task.repeat <= 0) {
                    this._toRemove.push(id)
                }
            }
        })

        // 清理已完成/无效的任务
        for (const id of this._toRemove) {
            const task = this._tasks.get(id)
            if (task) {
                this._removeFromTarget(task.target, id)
                this._tasks.delete(id)
            }
        }
    }
}
export const TimerMgr = $gb.SingleFunc(_TimerMgr)
