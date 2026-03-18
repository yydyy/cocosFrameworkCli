type ConstructorTemplateType<T = any> = new (...args: any[]) => T;
export type SingleInstance<T extends new (...args: any) => any> = T & {
    /**单例对象方法 */
    Ins: (...args: ConstructorParameters<T>) => InstanceType<T>;
};
/**
 * 单利方法
 * @example
 * target依然可以继承,不会有影响
 * 推荐用法
 * const MyClass = SingleFunc(class {})
 * 或者
 * const MyClass = SingleFunc(class extends ParentClass {})
 * 或者
 * const p:InstanceType<typeof(MyClass)>=new MyClass()          //这是特殊需求
 * @param
 * @returns
 */
export declare function SingleFunc<T extends ConstructorTemplateType<any>>(target: T): SingleInstance<T>;
/** SingleFunc 包装后的类型 */
export type SingleFuncClass<T = any> = {
    Ins: (...args: any[]) => T;
};
/**
 * 单例构造函数包装器
 * 不管 new 多少次，返回的都是同一个实例
 * 注意由于修改了constructor，不支持继层，不然new出来也不会走子类的构造
 * @param classCtor 原始类构造函数
 * @param args 构造函数参数 首次有效
 * @example
 * const MySingleton = SingletonProxy(MyClass);
 * const a = new MySingleton();
 * const b = new MySingleton();
 * console.log(a === b); // true
 */
export declare function SingletonProxy<T extends new (...args: any[]) => any>(classCtor: T, ...args: any[]): T;
export {};
