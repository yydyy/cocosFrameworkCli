/** 延时任务管理器 */
declare class TimeoutManager {
    /** 存储所有未执行的延时任务 */
    private _tasks;
    /** 当前任务 ID 计数器 */
    private _taskIdCounter;
    /**
     * 创建安全的延时任务
     * @param callback 回调函数
     * @param delay 延时时间（毫秒）
     * @param group 可选的分组标识
     * @returns 任务 ID，可用于手动取消
     */
    setTimeout(callback: () => void, delay: number, group?: string): number;
    /**
     * 清除延时任务
     * @param group 可选的分组标识
     * - 如果不传，清除所有未执行的延时
     * - 如果传递，只清除该分组的延时
     */
    clearTimeout(group?: string): void;
    /**
     * 获取指定分组的任务数量
     * @param group 分组标识
     * @returns 任务数量
     */
    getGroupCount(group: string): number;
    /**
     * 获取所有未执行的任务数量
     * @returns 任务总数
     */
    getTotalCount(): number;
}
declare const timeoutManager: TimeoutManager;
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
export declare function setTimeOutSafe(callback: () => void, delay: number, group?: string): number;
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
export declare function clearTimeoutSafe(group?: string): void;
export { timeoutManager, TimeoutManager };
type setTimeOutSafeType = typeof setTimeOutSafe;
type clearTimeoutSafeType = typeof clearTimeoutSafe;
declare global {
    interface Window {
        setTimeOutSafe: setTimeOutSafeType;
        clearTimeoutSafe: clearTimeoutSafeType;
        /**
        * 延时任务管理器  只有在debug模式下才会有实例
       */
        timeOutMgr?: TimeoutManager;
    }
    var setTimeOutSafe: setTimeOutSafeType;
    var clearTimeoutSafe: clearTimeoutSafeType;
}
