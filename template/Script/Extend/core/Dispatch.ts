// @FilePath: Dispatch.ts
/*
 * @Author: yyd
 * @Date: 2022-01-06 17:50:53
 * @Description: 派发（内存优化版）
 */

import type { EventType, CustomEvents, } from "../Base/Events";


type T = BaseType | symbol;

@$gb.Identifiable
class _Dispatch {
    // 核心数据结构：事件ID → 回调集合（不使用WeakMap）
    private _handlers = new Map<T, Map<object, ccArrayType<Function>>>();
    // 已注册的对象
    private _targetEvents = new WeakMap<object, Set<T>>();
    // once 的原始回调 → wrapper 映射：id → target → callBack → wrapper
    private _onceWrappers = new Map<T, WeakMap<object, Map<Function, Function>>>();

    /**
     * 注册事件
     * @param id 事件类型
     * @param callBack 回调函数
     * @param target 目标对象
     */
    on<K extends EventType>(
        id: K,
        callBack: CustomEvents[K],
        target: object
    ) {
        // 初始化事件ID对应的回调映射
        if (!this._handlers.has(id)) {
            this._handlers.set(id, new Map<object, ccArrayType<Function>>());
        }
        const targetMap = this._handlers.get(id)!;

        // 初始化target的回调数组
        if (!targetMap.has(target)) {
            targetMap.set(target, ccArray<Function>());
        }

        const callbacks = targetMap.get(target)!;

        // 检查重复注册
        if (callbacks.includes(callBack)) {
            clog.error(`重复注册 ${id.toString()}, ${target}, ${callBack}`);
            return;
        }

        // 记录target关联的事件ID
        if (!this._targetEvents.has(target)) {
            this._targetEvents.set(target, new Set());
        }
        this._targetEvents.get(target)!.add(id);
        callbacks.push(callBack);
    }
    /**
     * 一次注册事件（支持用原始 callBack 取消）
     * @param id 
     * @param callBack 
     * @param target 
     * @example
     * // 注册
     * Dispatch.Ins().once('event', this.onEvent, this)
     * // 取消（用原始回调）
     * Dispatch.Ins().off('event', this, this.onEvent)
     */
    once<K extends EventType>(
        id: K,
        callBack: CustomEvents[K],
        target: object
    ) {
        // 检查重复注册
        if (this._getOnceWrapper(id, target, callBack)) {
            clog.error(`once 重复注册 ${id.toString()}, ${target}, ${callBack}`);
            return;
        }
        const wrapper = (...args: any[]) => {
            callBack.apply(target, args);
            this._deleteOnceWrapper(id, target, callBack)
            this.off(id, target, wrapper)
        }
        this._setOnceWrapper(id, target, callBack, wrapper)
        this.on(id, wrapper as CustomEvents[K], target)
    }
    private _setOnceWrapper(id: T, target: object, callBack: Function, wrapper: Function) {
        if (!this._onceWrappers.has(id)) {
            this._onceWrappers.set(id, new WeakMap());
        }
        const targetMap = this._onceWrappers.get(id)!;
        if (!targetMap.has(target)) {
            targetMap.set(target, new Map());
        }
        targetMap.get(target)!.set(callBack, wrapper);
    }
    private _getOnceWrapper(id: T, target: object, callBack: Function): Function | undefined {
        return this._onceWrappers.get(id)?.get(target)?.get(callBack);
    }
    private _deleteOnceWrapper(id: T, target: object, callBack: Function) {
        const cbMap = this._onceWrappers.get(id)?.get(target);
        if (cbMap) {
            cbMap.delete(callBack);
        }
    }

    /**
     * 取消事件注册
     * @param id 事件类型
     * @param target 目标对象
     * @param callBack 回调函数（支持 once 的原始回调）
     */
    off(id: T, target: object, callBack?: Function) {
        const targetMap = this._handlers.get(id);
        if (!targetMap) return;
        const callbacks = targetMap.get(target);
        if (!callbacks) return;
        if (callBack) {
            // 检查是否是 once 的原始回调，如果是则找到对应的 wrapper
            const wrapper = this._getOnceWrapper(id, target, callBack);
            const actualCb = wrapper || callBack;
            if (wrapper) {
                this._deleteOnceWrapper(id, target, callBack);
            }
            callbacks.deleteElement(actualCb);
            if (callbacks.length === 0) {
                this._cleanTargetEvents(id, target)
            }
        } else {
            this._cleanTargetEvents(id, target)
        }
    }
    /**
     * 清理目标对象的事件ID记录
     * @param id 
     * @param target 
     */
    private _cleanTargetEvents(id: T, target: object) {
        const targetMap = this._handlers.get(id);
        // 清理target的事件ID记录
        const events = this._targetEvents.get(target);
        if (events) {
            events.delete(id);
            if (events.size === 0) {
                this._targetEvents.delete(target);
            }
        }
        // 清理 once 映射
        this._onceWrappers.get(id)?.delete(target);
        // 删除target的所有回调
        if (targetMap?.delete(target)) {
            // 清理空事件类型
            if (targetMap.size === 0) {
                this._handlers.delete(id);
            }
        }
    }
    /**
     * 派发事件
     * @param id 事件类型
     * @param args 参数
     */
    emit<K extends EventType>(
        id: K,
        ...args: Parameters<CustomEvents[K]>
    ) {
        const targetMap = this._handlers.get(id);
        if (!targetMap) return;

        // 遍历所有target和回调
        targetMap.forEach((callbacks, target) => {
            $forEach((cb) => {
                try {
                    cb.apply(target, args);
                } catch (e) {
                    clog.error(`回调 ${cb} 出错:`, e);
                }
            }, callbacks, target, true)
        });
    }
    /**
     * 异步并行派发事件 (实时遍历版)
     * @param id 事件类型
     * @param args 参数
     */
    async emitAsync<K extends EventType>(
        id: K,
        ...args: Parameters<CustomEvents[K]>
    ): Promise<void> {
        const targetMap = this._handlers.get(id);
        if (!targetMap) return;

        const tasks: Promise<void>[] = [];

        // 实时遍历：事件ID -> 目标对象 -> 回调数组
        targetMap.forEach((callbacks, target) => {
            for (const cb of callbacks) {
                // 将每个回调包装为 Promise 任务
                const task = (async () => {
                    try {
                        // 兼容同步和异步函数
                        await cb.apply(target, args);
                    } catch (e) {
                        clog.error(`异步回调 ${cb} 出错:`, e);
                    }
                })();
                tasks.push(task);
            }
        });
        // 等待所有订阅者的异步逻辑并行执行完毕
        await Promise.all(tasks);
    }

    /**
     * 串行异步派发 (如果需要按顺序等待每个订阅者)
     */
    async emitAsyncSeries<K extends EventType>(
        id: K,
        ...args: Parameters<CustomEvents[K]>
    ): Promise<void> {
        const targetMap = this._handlers.get(id);
        if (!targetMap) return;

        // 获取当前时刻的所有 target 键，防止遍历中途 Map 变化
        const targets = Array.from(targetMap.keys());

        for (const target of targets) {
            const callbacks = targetMap.get(target);
            if (!callbacks) continue;

            for (let a = callbacks.length - 1; a >= 0; a--) {
                const cb = callbacks[a];
                try {
                    await cb.apply(target, args);
                } catch (e) {
                    clog.error(`串行异步回调出错:`, e);
                }
            }
        }
    }
    /**
     * 清除目标对象的所有事件
     * @param target 目标对象
     */
    targetOff(target?: object) {
        if (!target) {
            return;
        }
        // 通过预存记录高效删除
        const events = this._targetEvents.get(target);
        events?.forEach(id => this._cleanTargetEvents(id, target));
    }

    /**
     * 清除特定事件类型
     * @param id 事件类型 如果为空，则清除所有事件类型
     */
    idOff(id?: T) {
        if (id === null) {
            this._handlers.clear();
            this._onceWrappers.clear();
            return
        }
        const targetMap = this._handlers.get(id);
        if (!targetMap) return;
        this._handlers.delete(id);
        this._onceWrappers.delete(id);
    }
}
/**
 * 派发（内存优化版）
 */
export const Dispatch = $gb.SingleFunc(_Dispatch)
