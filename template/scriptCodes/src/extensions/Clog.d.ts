export interface LogFunc extends Console {
    /**默认日志 */
    log: (...args: any[]) => void;
    /**错误日志 */
    error: (...args: any[]) => void;
    /**警告日志 */
    warn: (...args: any[]) => void;
    /**网络日志 */
    net: (...args: any[]) => void;
    /**数据 | 控制日志 */
    model: (...args: any[]) => void;
    /**视图日志 */
    view: (...args: any[]) => void;
    /**配置日志 */
    config: (...args: any[]) => void;
    /**单纯换行 */
    space: () => void;
    /**设置日志标签 */
    setTags: (tag: number) => void;
}
/**日志类型 */
export declare enum LogType {
    /** 网络层日志 */
    net = 1,
    /** 数据结构层日志 */
    model = 2,
    /** 视图层日志 */
    view = 4,
    /** 配置日志 */
    config = 8,
    /** 错误日志 */
    error = 16,
    /** 警告日志 */
    warn = 32,
    /** 标准日志 */
    log = 64
}
export declare class CLog {
    private _globalTag;
    setTags(tag: number): void;
    constructor();
    /**
   * 重写 console.error 以过滤特定错误
   */
    private _patchConsoleerror;
    /**
     * 创建代理
     * @returns
     */
    createProxy(): LogFunc;
}
declare global {
    interface Window {
        clog: LogFunc;
    }
    const clog: LogFunc;
}
