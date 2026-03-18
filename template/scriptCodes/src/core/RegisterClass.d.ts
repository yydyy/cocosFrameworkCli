type ConstructorTemplateType<T = any> = new (...args: any[]) => T;
type BaseType = number | string;
declare class RegisterClass {
    private _registerMap;
    get onlyId(): number;
    get className(): string;
    /**
     * 注册类|Func
     * @param id
     * @param target 类构造函数或函数
     */
    setClass(id: BaseType, target: ConstructorTemplateType | Function): void;
    /**
     * 根据id获取类|Func
     * @param id 类的唯一标识
     * @returns 类构造函数
     */
    getClassById<T = any>(id: BaseType): T | undefined;
    /**
     * 根据类|Func获取id
     * @param target 类构造函数或函数
     * @returns
     */
    getIdByTarget(target: ConstructorTemplateType | Function): BaseType | null;
    private _registerWeakMap;
    /**
     * 注册组件的 xxxxx 方法,在组件  xxx  时调用
     * 主要防止 多次hook 同个函数导致被顶掉的问题  不能注册onDestroy 有专门的方法
     * @param component
     * @param hookFunction
     * @returns
     */
    /**
     * 注册组件的销毁清理函数，在组件的 onDestroy 等 方法内执行。
     * 主要防止多次 hook 同个函数导致被顶掉的问题。
     * @param component 要 Hook 的组件实例。
     * @param hookFunction 在组件销毁时执行的清理函数。
     */
    registerDestroyHook(component: cc.Component, hookFunction: Function): void;
}
/**
 * 类|Func 注册中心
 */
export declare const gRegisterClass: RegisterClass;
declare global {
    interface Window {
        gRegisterClass: RegisterClass;
    }
    /**     * 类|Func 注册中心     */
    const gRegisterClass: RegisterClass;
}
export {};
