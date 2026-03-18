// @FilePath: Clog.ts
/*
 * @Author: yyd
 * @Date: 2024-04-13 16:46:10
 * @LastEditTime: 2026-01-02 15:42:50
 * @FilePath: \cocosTools\assets\Script\Extend\Clog.ts
 * @Description:  日志
 */

export interface LogFunc extends Console {
    /**默认日志 */
    log: (...args: any[]) => void
    /**错误日志 */
    error: (...args: any[]) => void
    /**警告日志 */
    warn: (...args: any[]) => void
    /**网络日志 */
    net: (...args: any[]) => void
    /**数据 | 控制日志 */
    model: (...args: any[]) => void
    /**视图日志 */
    view: (...args: any[]) => void
    /**配置日志 */
    config: (...args: any[]) => void
    /**单纯换行 */
    space: () => void
    /**设置日志标签 */
    setTags: (tag: number) => void
}

/**日志类型 */
export enum LogType {
    /** 网络层日志 */
    net = 1 << 0,
    /** 数据结构层日志 */
    model = 1 << 1,
    /** 视图层日志 */
    view = 1 << 2,
    /** 配置日志 */
    config = 1 << 3,
    /** 错误日志 */
    error = 1 << 4,
    /** 警告日志 */
    warn = 1 << 5,
    /** 标准日志 */
    log = 1 << 6,
}

// 默认颜色配置
const DEFAULT_COLORS = {
    [LogType.net]: "#ee7700",
    [LogType.model]: "#800080",
    [LogType.view]: "#00CC00",
    [LogType.config]: "#3a5fcd",
    [LogType.error]: "#ff0000", // 修改错误颜色为更明显的红色
    [LogType.warn]: "#ffaa00", // 修改警告颜色为橙色
    [LogType.log]: "#627b93",
};

// 默认标签名称
const DEFAULT_TAG_NAMES = {
    [LogType.net]: "网络",
    [LogType.model]: "数据",
    [LogType.view]: "视图",
    [LogType.config]: "配置",
    [LogType.error]: "错误",
    [LogType.warn]: "警告",
    [LogType.log]: "日志",
};

/**
* 获取格式化的时间字符串（带缓存优化）
*/
const formattedTime = (function () {
    let lastMs = -1;       // 上一次执行时的总毫秒数
    let lastSecond = -1;   // 上一次缓存的秒数（用于更新时分秒）
    let baseTimeStr = "";  // 缓存的 "HH:mm:ss" 部分
    let fullTimeStr = "";  // 最终的完整缓存 "[HH:mm:ss.SSS]"
    return () => {
        const now = Date.now();        //每一次 new 及其廉价 内部只有一个64位的数字
        // 1. 同一毫秒内直接返回缓存（极端高频调用优化）
        if (now === lastMs) {
            return fullTimeStr;
        }
        // 2. 检查秒数是否改变，若改变则更新 "HH:mm:ss"
        const currentSecond = Math.floor(now / 1000);
        if (currentSecond !== lastSecond) {
            lastSecond = currentSecond;
            const d = new Date(now);
            const h = d.getHours().toString().padStart(2, '0');
            const m = d.getMinutes().toString().padStart(2, '0');
            const s = d.getSeconds().toString().padStart(2, '0');
            baseTimeStr = `${h}:${m}:${s}`;
        }
        // 3. 计算毫秒部分 (0-999) 并更新完整字符串
        // 使用 % 运算符代替 Date 对象的 getMilliseconds，更快
        const ms = (now % 1000).toString().padStart(3, '0');

        lastMs = now;
        fullTimeStr = `[${baseTimeStr}.${ms}]`;

        return fullTimeStr;
    };
})();

export class CLog {
    private _globalTag: number = 0;
    setTags(tag: number) {
        this._globalTag = tag;
    }

    constructor() {
        this._patchConsoleerror();
    }
    /**
   * 重写 console.error 以过滤特定错误
   */
    private _patchConsoleerror(): void {
        // const originalerror = cc.error || console.error;
        // cc.error = console.error = (msg: any, ...data: any[]) => {
        //     // 过滤 Cocos Creator 的特定警告
        //     if (CC_DEV && typeof msg === 'string' &&
        //         msg.startsWith("Sorry, ") && msg.includes("please use")) {
        //         return;
        //     }
        //     // 保留原始调用栈信息
        //     try {
        //         originalerror.apply(console, [msg, ...data]);
        //     } catch (e) {
        //         // 备用方案
        //         originalerror(msg, ...data);
        //     }
        // };
    }

    /**
     * 创建代理
     * @returns 
     */
    createProxy() {
        const target = console;
        const self = this; // 捕获 this 引用
        // 预计算堆栈信息字符串
        return new Proxy({} as any, {
            get(_, prop: string) {
                // 特殊处理 setTags 方法
                if (prop === "setTags") {
                    return (tag: number) => {
                        self._globalTag = tag;
                    };
                }
                // 1. 映射属性到 LogType 枚举 (例如：logger.net -> LogType.net)
                let type = (LogType as any)[prop] as LogType;
                if (prop === "space") {
                    return cc.log.bind(cc, "")
                }
                if (type !== undefined) {
                    // 2. 检查全局过滤开关
                    if ((self._globalTag & type) === 0) {
                        return () => { }; // 返回空函数，不执行任何操作
                    }

                    // 3. 确定使用的 console 方法
                    let method = target.log;
                    if (type === LogType.error) method = target.error;
                    else if (type === LogType.warn) method = target.warn;

                    const typeName = DEFAULT_TAG_NAMES[type];
                    const color = DEFAULT_COLORS[type];
                    const timeStr = formattedTime();

                    // 4. 根据平台执行不同的 bind 策略
                    if (cc.sys.isNative) {
                        // 原生平台：不支持颜色，直接拼接
                        return method.bind(target, `${timeStr}[${typeName}]:`);
                    } else {
                        // 浏览器或微信平台：使用 %c 样式
                        // 这里使用 bind 预设前缀，后续传入的参数会接在后面
                        return method.bind(
                            target,
                            `%c${timeStr} [${typeName}]%c:`,
                            `color: ${color}; font-weight: bold;`,
                            "color: inherit; font-weight: normal;"
                        );
                    }
                }
                // 兜底处理原生 console 方法访问
                const original = (target as any)[prop];
                return typeof original === 'function' ? original.bind(target) : original;
            }
        }) as LogFunc
    }
}
declare global {
    interface Window {
        clog: LogFunc;
    }
    const clog: LogFunc
}
window.clog = new CLog().createProxy()
let tag = LogType.config | LogType.model | LogType.view | LogType.net | LogType.error | LogType.warn | LogType.log
clog.setTags(tag)

