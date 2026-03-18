
/*
 * @Author: yyd
 * @Date: 2024-04-09 11:27:04
 * @LastEditTime: 2026-03-17 10:13:55
 * @FilePath: \scriptCodes\src\core\RegisterClass.ts
 * @Description:  类|Func 注册中心
 */

import { SingletonProxy } from "../decorators/Singleton"
import { getOnlyId } from "../decorators/Identifiable"

type ConstructorTemplateType<T = any> = new (...args: any[]) => T
type BaseType = number | string

class RegisterClass {
    private _registerMap: Map<BaseType, any> = new Map()

    get onlyId() {
        return getOnlyId()
    }
    get className() {
        return "RegisterClass"
    }
    /**
     * 注册类|Func
     * @param id 
     * @param target 类构造函数或函数
     */
    setClass(id: BaseType, target: ConstructorTemplateType | Function) {
        this._registerMap.set(id, target)
    }

    /**
     * 根据id获取类|Func
     * @param id 类的唯一标识
     * @returns 类构造函数
     */
    getClassById<T = any>(id: BaseType): T | undefined {
        return this._registerMap.get(id)
    }

    /**
     * 根据类|Func获取id
     * @param target 类构造函数或函数
     * @returns 
     */
    getIdByTarget(target: ConstructorTemplateType | Function) {
        for (const [key, value] of this._registerMap) {
            if (value === target) {
                return key
            }
        }
        return null
    }
    //
    private _registerWeakMap: WeakMap<any, Function[]> = new WeakMap()
    /**
     * 注册组件的 xxxxx 方法,在组件  xxx  时调用 
     * 主要防止 多次hook 同个函数导致被顶掉的问题  不能注册onDestroy 有专门的方法
     * @param component 
     * @param hookFunction 
     * @returns 
     */
    // registerHook(component: any, hookFunction: Function, funcName: string) {
    //     if (this._registerWeakMap.has(component)) {
    //         const funcs = this._registerWeakMap.get(component)
    //         funcs?.push(hookFunction)
    //         return
    //     } else {
    //         this._registerWeakMap.set(component, [hookFunction])
    //     }
    //     const hookFunc = component[funcName]
    //     component[funcName] = (...args) => {
    //         const func = this._registerWeakMap.get(component)
    //         func?.forEach(f => {
    //             try {
    //                 f.apply(component, args)
    //             } catch (e) {
    //                 // 记录异常，但继续执行下一个 Hook 函数
    //                 clog.error(`RegisterClass: Hook function failed during ${funcName} on component ${component.__classname__ || component.name}:`, e)
    //             }
    //         })
    //         hookFunc?.apply(component, args)
    //     }
    // }

    /**
     * 注册组件的销毁清理函数，在组件的 onDestroy 等 方法内执行。
     * 主要防止多次 hook 同个函数导致被顶掉的问题。
     * @param component 要 Hook 的组件实例。
     * @param hookFunction 在组件销毁时执行的清理函数。
     */
    registerDestroyHook(component: cc.Component, hookFunction: Function) {
        if (this._registerWeakMap.has(component)) {
            const funcs = this._registerWeakMap.get(component)
            funcs?.push(hookFunction)
            return
        } else {
            this._registerWeakMap.set(component, [hookFunction])
        }

        const hookFunc = component["onDestroy"]
        component["onDestroy"] = (...args: any) => {
            const func = this._registerWeakMap.get(component)
            hookFunc?.apply(component, args)//源函数
            func?.forEach(f => f.apply(component, args))
            this._registerWeakMap.delete(component) //注册的onDestroy方法是在系统调用后执行的
        }
    }
}

const rgs = SingletonProxy(RegisterClass)
/**
 * 类|Func 注册中心
 */
export const gRegisterClass = new rgs()
declare global {
    interface Window {
        gRegisterClass: RegisterClass
    }
    /**     * 类|Func 注册中心     */
    const gRegisterClass: RegisterClass
}
window.gRegisterClass = gRegisterClass
