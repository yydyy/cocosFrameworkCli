export {};
/**
 * 配合isValid使用，自动捕获 async 函数中的“静默中断”错误，防止控制台报红
 * @param target 类实例
 * @param propertyKey 方法名
 * @param descriptor 方法描述符
 * @returns
 */
declare function SafeAsync(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
type SafeAsyncType = typeof SafeAsync;
declare global {
    /**全局 hook */
    interface Promise<T> {
        /**处理异步后生命周期问题 */
        isValid: <T>(liftTarget: {
            isValid: boolean;
        }) => Promise<T>;
    }
    interface Window {
        /**
         * 异步函数装饰器，自动处理生命周期问题
         */
        SafeAsync: SafeAsyncType;
    }
    var SafeAsync: SafeAsyncType;
}
