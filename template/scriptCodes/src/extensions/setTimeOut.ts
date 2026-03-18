// @FilePath: setTimeOut.ts
/*
 * @Author: yyd
 * @Date: 2024-04-13 16:46:10
 * @LastEditTime: 2026-03-17 11:00:00
 * @FilePath: \scriptCodes\src\extensions\setTimeOut.ts
 * @Description:  安全的延时管理，支持分组清理
 */

declare const CC_DEV: boolean;

/** 延时任务接口 */
interface TimeoutTask {
    id: number;
    callback: () => void;
    group?: string;
}

/** 延时任务管理器 */
class TimeoutManager {
    /** 存储所有未执行的延时任务 */
    private _tasks: Map<number, TimeoutTask> = new Map();
    /** 当前任务 ID 计数器 */
    private _taskIdCounter: number = 0;

    /**
     * 创建安全的延时任务
     * @param callback 回调函数
     * @param delay 延时时间（毫秒）
     * @param group 可选的分组标识
     * @returns 任务 ID，可用于手动取消
     */
    setTimeout(callback: () => void, delay: number, group?: string): number {
        const taskId = ++this._taskIdCounter;

        const timeoutId = setTimeout(() => {
            // 任务执行完成后从管理器中移除
            this._tasks.delete(taskId);
            callback();
        }, delay);

        // 存储任务信息
        this._tasks.set(taskId, {
            id: taskId,
            callback,
            group
        });

        return taskId;
    }

    /**
     * 清除延时任务
     * @param group 可选的分组标识
     * - 如果不传，清除所有未执行的延时
     * - 如果传递，只清除该分组的延时
     */
    clearTimeout(group?: string): void {
        if (group === undefined) {
            // 清除所有未执行的延时
            this._tasks.forEach((task, taskId) => {
                clearTimeout(task.id);
            });
            this._tasks.clear();
        } else {
            // 只清除指定分组的延时
            const toDelete: number[] = [];
            this._tasks.forEach((task, taskId) => {
                if (task.group === group) {
                    clearTimeout(task.id);
                    toDelete.push(taskId);
                }
            });
            toDelete.forEach(id => this._tasks.delete(id));
        }
    }

    /**
     * 获取指定分组的任务数量
     * @param group 分组标识
     * @returns 任务数量
     */
    getGroupCount(group: string): number {
        let count = 0;
        this._tasks.forEach(task => {
            if (task.group === group) {
                count++;
            }
        });
        return count;
    }

    /**
     * 获取所有未执行的任务数量
     * @returns 任务总数
     */
    getTotalCount(): number {
        return this._tasks.size;
    }
}

// 创建全局单例
const timeoutManager = new TimeoutManager();
if (CC_DEV) window["timeOutMgr"] = timeoutManager;
/**
 * 安全的延时函数，支持分组管理
 * @param callback 回调函数
 * @param delay 延时时间（毫秒）
 * @param group 可选的分组标识
 * @returns 任务 ID，可用于手动取消
 * 
 * @example
 * ```typescript
 * // 基本用法
 * setTimeOutSafe(() => {
 *     console.log("3 秒后执行");
 * }, 3000);
 * 
 * // 分组管理
 * setTimeOutSafe(() => {
 *     console.log("UI 更新");
 * }, 1000, "ui");
 * 
 * setTimeOutSafe(() => {
 *     console.log("网络请求");
 * }, 2000, "network");
 * 
 * // 清除指定分组
 * clearTimeoutSafe("ui"); // 只清除 ui 分组的延时
 * 
 * // 清除所有
 * clearTimeoutSafe(); // 清除所有未执行的延时
 * ```
 */
export function setTimeOutSafe(callback: () => void, delay: number, group?: string): number {
    return timeoutManager.setTimeout(callback, delay, group);
}

/**
 * 清除延时任务
 * @param group 可选的分组标识
 * - 如果不传，清除所有未执行的延时
 * - 如果传递，只清除该分组的延时
 * 
 * @example
 * ```typescript
 * clearTimeoutSafe(); // 清除所有
 * clearTimeoutSafe("network"); // 只清除 network 分组
 * ```
 */
export function clearTimeoutSafe(group?: string): void {
    timeoutManager.clearTimeout(group);
}

// 导出管理器，方便调试和高级用法
export { timeoutManager, TimeoutManager };

type setTimeOutSafeType = typeof setTimeOutSafe;
type clearTimeoutSafeType = typeof clearTimeoutSafe;

declare global {
    interface Window {
        setTimeOutSafe: setTimeOutSafeType
        clearTimeoutSafe: clearTimeoutSafeType
        /**
        * 延时任务管理器  只有在debug模式下才会有实例
       */
        timeOutMgr?: TimeoutManager
    }
    var setTimeOutSafe: setTimeOutSafeType
    var clearTimeoutSafe: clearTimeoutSafeType
}

// 暴露到全局作用域
window.setTimeOutSafe = setTimeOutSafe;
window.clearTimeoutSafe = clearTimeoutSafe;
