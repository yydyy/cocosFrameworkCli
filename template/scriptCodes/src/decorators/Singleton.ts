// @FilePath: Singleton.ts
/*
 * @Author: yyd
 * @Date: 2024-04-09 11:27:04
 * @LastEditTime: 2026-03-16 14:17:49
 * @FilePath: \scriptCodes\src\decorators\Singleton.ts
 * @Description:  单例装饰器模块
 */

// 模拟CC_DEV变量
declare const CC_DEV: boolean;

// 构造函数模板类型
type ConstructorTemplateType<T = any> = new (...args: any[]) => T;


// 定义泛型装饰器类型
export type SingleInstance<T extends new (...args: any) => any> = T & {
    /**单例对象方法 */
    Ins: (...args: ConstructorParameters<T>) => InstanceType<T>;
}

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
export function SingleFunc<T extends ConstructorTemplateType<any>>(target: T): SingleInstance<T> {
    const ctor = target as SingleInstance<T>;
    // 使用闭包存储实例
    let instance: InstanceType<T>;
    // 添加静态方法 Ins
    ctor.Ins = function (...args: any[]) {
        if (!instance) {
            instance = new target(...args);
        }
        return instance;
    };
    if (CC_DEV) {//开发环境
        (window as any)[ctor.name] = target
    }
    return ctor;
}
/** SingleFunc 包装后的类型 */
export type SingleFuncClass<T = any> = { Ins: (...args: any[]) => T }


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
export function SingletonProxy<T extends new (...args: any[]) => any>(classCtor: T, ...args: any[]): T {
    let instance: InstanceType<T>;
    const proxy = new Proxy(classCtor, {
        construct(target, _: any[], newTarget: Function): object {
            if (!instance) {
                instance = new target(...args);
                // 防止通过 instance.constructor 获取原始构造函数再次 new
                instance.constructor = proxy;
                const name = instance.className || target.name
                if (CC_DEV) {
                    (window as any)[name] = proxy
                }
            }
            return instance as object;
        }
    });
    return proxy;
}

