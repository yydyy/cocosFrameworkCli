// @FilePath: Registrars.ts
/*
 * @Author: yyd
 * @Date: 2024-04-09 11:27:04
 * @LastEditTime: 2026-03-17 10:14:46
 * @FilePath: \scriptCodes\src\decorators\Registrars.ts
 * @Description:  注册函数模块
 */


// 模拟IViewDefined接口
interface IViewDefined {
    uid: string;
    path: string;
    bundle?: string;
    windowType?: string;
    zdx?: number;
}

// 基础类型
type BaseType = number | string;

// 构造函数模板类型
type ConstructorTemplateType<T = any> = new (...args: any[]) => T;

// 导入SingleFuncClass类型
import type { SingleFuncClass } from './Singleton';

/**
 * 将 class 注入到注册中心，方便根据 id 获取 class 来实例化
 * @param id 
 * @returns 
 */
export function registerClass(id: BaseType) {
    return function (target: any) {
        gRegisterClass.setClass(String(id), target)
    }
}

/**
 * 注册控制器 ID 的装饰器，使用 npm run generate-ctrl-map 生成类型文件
 * 注意：此装饰器会被插件识别并提取控制器 ID
 * @param id 控制器 ID
 * 
 * @example
 * ```typescript
 * @registerCtrlId("BattleCtrl")
 * export class BattleCtrl extends BaseCtrl { }
 * 
 * // 或使用 xxx.ID 格式
 * @registerCtrlId(CtrlId.BattleCtrl)
 * export class BattleCtrl extends BaseCtrl { }
 * 
 * $app.ctrl.getCtrlOrAdd(CtrlId.BattleCtrl) // 获取控制器实例
 * ```
 */
export function registerCtrlId(id: string) {
    return function (target: any) {
        gRegisterClass.setClass(id, target)
    }
}

/**
 * 注册事件类型的标志，用于类型检查，使用 npm run generate-event-type 生成类型文件
 * 注意：此函数仅用于类型标记，不会实际执行，参数中的函数类型会被插件提取
 * @param id 事件类型
 * @param funcType 函数类型声明，不用传入，声明类型 T 就行
 * 
 * @example
 * ```typescript
 * registerEvent<(data: string) => void>("CUSTOM_EVENT")
 * registerEvent<(data: number) => boolean>("MY_TEST")
 * registerEvent<(data: symbol) => void>("OPP")
 * 
 * // 或使用 xxx.ID 格式
 * registerEvent<(data: string) => void>(GameEvents.CUSTOM_EVENT)
 * ```
 */
export function registerEvent<T extends Function>(id: string, funcType?: T): void {

}

/**
 * 注册界面定义
 * 支持两种用法：
 * 1. 作为函数调用：registerView({ uid: "MainView", ... })
 * 2. 作为装饰器：@registerView({ uid: "MainView", ... })
 * @param viewInfo 界面定义
 */
export function registerView(viewInfo: IViewDefined): any {
}


declare const $app: any
function extendApp(key: string, getter: () => any) {
    Object.defineProperty($app, key, {
        get: getter,
        configurable: true
    });
}

/**
 * 注册单例到 $app
 * @param key $app 上的属性名
 * @param singleton 单例对象（支持 SingleFunc / SingletonProxy / 普通对象）
 * @example
 * ```typescript
 * // 1. 类型声明
 * declare module "../../App" {
 *     interface IAppExtend { battle: InstanceType<typeof BattleMgr> }
 * }
 * 
 * // 2. 定义单例
 * export const BattleMgr = SingleFunc(class {  或者 SingletonProxy(class {
 *     startBattle() { }
 * })
 * 
 * // 3. 注册到 $app
 * registerApp("battle", BattleMgr)
 * 
 * // 4. 使用
 * $app.battle.startBattle()
 * 
 * //注意：如果在update中或者高频访问，做缓存优化
 * //缓存引用
 * private _battle = $app.battle
 * update(dt) {
 *     this._battle.tick(dt)  // 直接访问
 * }
 * ```
 */
export function registerApp<T>(
    key: string,
    singleton: SingleFuncClass<T> | ConstructorTemplateType<T> | T
) {
    if (typeof singleton === 'function') {
        const s = singleton as SingleFuncClass<T> | ConstructorTemplateType<T>
        // SingleFunc: 有 Ins 方法
        if ('Ins' in s && typeof s.Ins === 'function') {
            extendApp(key, () => s.Ins())
        }
        // SingletonProxy: 是构造函数，每次 new 返回同一实例
        else {
            let instance: T
            extendApp(key, () => instance || (instance = new (s as ConstructorTemplateType<T>)()))
        }
    }
    // 普通对象实例  自定义的单利实例
    else {
        extendApp(key, () => singleton)
    }
}


