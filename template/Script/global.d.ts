// @FilePath: global.d.ts
/*
 * @Author: yyd
 * @Description: 全局类型声明
 */

/// <reference path="./types/CoreScripts.d.ts" />

import type { AppType } from "./App";
import type { ReleaseType } from "./Extend/mgr/ReleaseType";
import type { UiId } from "./Extend/Base/UiDefines";
import type { CtrlId } from "./Extend/Base/Ectrl";
import type { Rgclass } from "./Extend/core/RegisterClass";

type ForEachCallback<T> = (
    value: ValueType<T>,
    key: KeyType<T>,
    wIdx?: number
) => void | boolean;

type ValueType<T> =
    T extends Array<infer U> ? U :
    T extends Set<infer U> ? U :
    T extends Map<any, infer V> ? V :
    T extends Record<string, infer V> ? V :
    T;

type KeyType<T> =
    T extends Array<any> ? number :
    T extends Set<any> ? number :
    T extends Map<infer K, any> ? K :
    T extends object ? keyof T :
    number;

declare global {
    type UiIdType = valueof<typeof UiId>
    type CtrlIdType = valueof<typeof CtrlId>
    /**类型T的value类型 */
    type valueof<T> = T[keyof T]
    /**基础类型 */
    type BaseType = number | string
    /**构造函数模版 */
    type ConstructorTemplateType<T = any> = new (...args: any[]) => T

    interface Window {
        /**$app 管理器*/
        $app: AppType
        $forEach: <T>(
            callback: ForEachCallback<T>,
            param: T,
            target?: any,
            isReversed?: boolean
        ) => void
        /**
         * 条件断言（开发环境）
         * @param condition 条件为 true 时跳过，为 false 时触发警告
         * @param isDebugger 是否触发断点（默认 false）
         * @param args 打印参数
         */
        CONDITION_ASSET: (condition: boolean, isDebugger?: boolean, ...args: any[]) => void
        /**类|Func 注册中心 */
        gRegisterClass: InstanceType<typeof Rgclass>
    }

    namespace cc {
        interface RenderTexture {
            /**导出缺失的接口 */
            drawTextureAt: (texture: cc.Texture2D, x: number, y: number) => void
        }
        interface Node {
            /**
             * 像素级点击注册
             * @param type 
             * @param callback 
             * @param target 
             * @param thresholdOpcaity 透明度阈值 低于这个阀值不会响应 max:255
             * @param useCapture 
             * @returns 
             */
            onPixel: <T extends Function>(type: string, callback: T, target?: any, thresholdOpcaity?: number, useCapture?: boolean) => T
            onceOnPixel: <T extends Function>(type: string, callback: T, target?: any, thresholdOpcaity?: number, useCapture?: boolean) => T
            offPixel: (type: string, callback?: Function, target?: any, useCapture?: boolean) => void
            /**
             * 获取组件,如果不存在就创建
             * @param type 
             */
            getComponentOrAdd<T extends Component>(type: { prototype: T }): T
            /**
             * 通过名字获取子节点的组件
             * @param name 子节点名字
             * @param type 子节点组件类型
             */
            getChildComponentByName<T extends Component>(name: string, type: { prototype: T }): T
            /**
             * 以installof的方式获取组件 主要是装饰器导致构造函数不一致的问题
             * @param type 
             */
            getComponentInstallof<T extends Component>(type: { prototype: T } | string): T
        }
        interface Component {
            /**
             * 获取组件,如果不存在就创建
             * @param type 
             */
            getComponentOrAdd<T extends Component>(type: { prototype: T }): T
            /**
             * 通过名字获取子节点的组件
             * @param childName 子节点名字
             * @param type 子节点组件类型
             */
            getChildComponentByName<T extends Component>(childName: string, type: { prototype: T }): T
            /**
             * 以间接的方式获取组件 主要是修改构造函数导致的类型的问题
             * @param type 
             */
            getComponentInstallof<T extends Component>(type: { prototype: T }): T
        }
        interface Sprite {
            /**
             * 设置精灵自动释放的API
             * @param path 路径 bundleName.xx/xxx
             * @param lifeTarget 生命周期对象 null:自己为生命对象
             * @param immediatelyClearOld 是否立刻释放旧的资源(默认false) false:lifeTarget.onDestroy中释放 true:立刻释放
             * @returns void
             */
            setAutoSpriteFrame: (path: string, lifeTarget?: cc.Node | cc.Component, relaseType?: ReleaseType, immediatelyClearOld?: boolean) => Promise<void>
        }
        interface SpriteFrame {
            /**
             * 设置纹理自动释放的接口
             * 这个API是针对直接加载为texture2D的情况,一般用的不多
             * @param path 路径 bundleName.xx/xxx
             * @param lifeTarget 生命周期对象 null:自己为生命对象
             * @param immediatelyClearOld 是否立刻释放旧的资源(默认false) false:lifeTarget.onDestroy中释放 true:立刻释放
             * @param texture2DParams 纹理参数
             * @returns 
             */
            setAutoTexture: (path: string, lifeTarget?: cc.Node | cc.Component, relaseType?: ReleaseType, immediatelyClearOld?: boolean, texture2DParams?: { rect?: cc.Rect, rotated?: boolean, offset?: cc.Vec2, originalSize?: cc.Size }) => Promise<void>
            _rect: cc.Rect
            _texture: cc.Texture2D
        }
        interface Asset {
            _id: number | string
        }
    }

    /**
     * 条件断言（开发环境）
     * @param condition 条件为 true 时跳过，为 false 时触发警告
     * @param isDebugger 是否触发断点（默认 false）
     * @param args 打印参数
     */
    const CONDITION_ASSET: (condition: boolean, isDebugger?: boolean, ...args: any[]) => void
    /**全局代理 */
    const $app: AppType
    const $forEach: <T>(
        callback: ForEachCallback<T>,
        param: T,
        target?: any,
        isReversed?: boolean
    ) => void
    /**类|Func 注册中心 */
    const gRegisterClass: InstanceType<typeof Rgclass>
}

