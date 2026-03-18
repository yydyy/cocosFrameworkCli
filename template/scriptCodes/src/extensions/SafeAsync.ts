/**静默中断的信号 */
const SILENT_SIGNAL = "SILENT_INTERRUPT"

export {}
/** 增强版：支持后置检查与并发处理 */
Promise.prototype.isValid = function (liftTarget: any) {
    // 1. 同时处理成功 (then) 和 失败 (catch)
    // 使用 finally 的逻辑思路，但由于要拦截返回，依然使用 then 和 catch
    return this.then(
        (result) => {
            // 异步任务成功了，检查对象是否还活着
            const isDead = (typeof cc !== 'undefined' && cc.isValid)
                ? !cc.isValid(liftTarget)
                : (liftTarget && liftTarget.isValid === false);

            if (liftTarget != null && isDead) {
                return Promise.reject(SILENT_SIGNAL);
            }
            return result;
        },
        (error) => {
            // 如果原本的任务(如 getRes)就失败了，先检查对象
            // 如果对象已经死了，没必要报加载错误，直接抛出静默中断
            const isDead = (typeof cc !== 'undefined' && cc.isValid)
                ? !cc.isValid(liftTarget)
                : (liftTarget && liftTarget.isValid === false);

            if (liftTarget != null && isDead) {
                throw SILENT_SIGNAL;
            }
            // 对象还活着，说明是真正的业务错误，继续抛出让 @SafeAsync 处理
            throw error;
        }
    );
};
/**
 * 配合isValid使用，自动捕获 async 函数中的“静默中断”错误，防止控制台报红
 * @param target 类实例
 * @param propertyKey 方法名
 * @param descriptor 方法描述符
 * @returns 
 */
function SafeAsync(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        try {
            // 执行原函数
            await originalMethod.apply(this, args);
        } catch (err) {
            // 如果是我们要的“静默信号”，直接吞掉，假装无事发生
            if (err === SILENT_SIGNAL) {
                clog.warn("liftTarget is isValided!")
                return undefined
            }
            // 如果是真正的报错（比如代码写错了），继续抛出
            clog.error(err);
        }
    };
    return descriptor;
}

type SafeAsyncType = typeof SafeAsync

declare global {
    /**全局 hook */
    interface Promise<T> {
        /**处理异步后生命周期问题 */
        isValid: <T>(liftTarget: { isValid: boolean }) => Promise<T>
    }
    interface Window {
        /**
         * 异步函数装饰器，自动处理生命周期问题
         */
        SafeAsync: SafeAsyncType
    }
    var SafeAsync: SafeAsyncType
}

// 将 SafeAsync 暴露到全局作用域
window.SafeAsync = SafeAsync