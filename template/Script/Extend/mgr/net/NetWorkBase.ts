/**
 * 网络状态
 */

export interface INetWork {
    /**
     * 解码数据
     * @param data 待解码数据
     * @returns 解码后的数据
     */
    decode(data: ArrayBuffer): any
    /**
     * 编码数据
     * @param data 待编码数据
     * @returns 编码后的数据
     */
    encode(data: any): ArrayBuffer
    /**
     * 关闭网络连接
     */
    close(): void
}

export enum NetWorkType {
    /** WebSocket */
    WS = "ws",
}

export enum NetWorkState{
    /** 初始化 */
    INIT = "init",
    /** 错误 */
    ERROR = "error",
    /** 已关闭 */
    CLOSED = "closed",
    /** 连接中 */
    CONNECTING = "connecting",
    /** 已连接 */
    CONNECTED = "connected",
    /** 已打开 */
    OPEN = "open",
}