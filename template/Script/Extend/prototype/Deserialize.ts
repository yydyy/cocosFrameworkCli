// @FilePath: Deserialize.ts
/*
 * @Author: yyd
 * @Date: 2024-07-01 16:41:44
 * @LastEditTime: 2026-02-25 23:06:14
 * @FilePath: \cocosTools\assets\Script\Extend\prototype\Deserialize.ts
 * @Description:  扩展hook PixelFunc解析 装饰器 自动绑定属性
 */

import type { ReleaseType } from "../mgr/ReleaseType"
import LoadSpriteFrameSeries, { LoadSpriteFrameClass } from "../ui/LoadSpriteFrameSeries"

// @ts-ignore
// const onDestroy = cc.Mask.prototype.onDestroy
// // @ts-ignore
// cc.Mask.prototype.onDestroy = function () {
//     try {
//         onDestroy.call(this)
//     } catch (e) {
//         //头像丢失引用的错误直接忽略
//         //console.error(e)
//     }
// }

//
cc.Sprite.prototype.setAutoSpriteFrame = async function (path: string, lifeTarget?: cc.Node | cc.Component, relaseType?: ReleaseType, immediatelyClearOld?: boolean) {
    lifeTarget = lifeTarget || this
    const that = this as cc.Sprite
    immediatelyClearOld = immediatelyClearOld ?? false
    const loadSpriteFrameSeries = that.getComponentOrAdd(LoadSpriteFrameSeries)
    const token = loadSpriteFrameSeries.add()
    const sf = await $app.load.getRes(path, cc.SpriteFrame, lifeTarget, relaseType).isValid(lifeTarget)
    if (immediatelyClearOld) {
        $app.load.releaseAsset(that.spriteFrame, lifeTarget)
    }
    if (!loadSpriteFrameSeries.isLast(token)) return//时序不对return
    this.spriteFrame = sf
}
SafeAsync(cc.Sprite.prototype, "setAutoSpriteFrame", Object.getOwnPropertyDescriptor(cc.Sprite.prototype, 'setAutoSpriteFrame'))


cc.SpriteFrame.prototype.setAutoTexture = async function (path: string, lifeTarget?: cc.Node | cc.Component, relaseType?: ReleaseType, immediatelyClearOld?: boolean, texture2DParams?: { rect?: cc.Rect, rotated?: boolean, offset?: cc.Vec2, originalSize?: cc.Size }) {
    lifeTarget = lifeTarget || this
    const that = this as cc.SpriteFrame
    immediatelyClearOld = immediatelyClearOld ?? false
    const asTarget = lifeTarget as any as { loadSpriteFrameClass: LoadSpriteFrameClass }
    const series = asTarget.loadSpriteFrameClass = asTarget.loadSpriteFrameClass || new LoadSpriteFrameClass()
    const token = series.add()
    const texture2D = await $app.load.getRes(path, cc.Texture2D, lifeTarget, relaseType).isValid(lifeTarget)
    if (immediatelyClearOld) {
        const texture = that.getTexture()
        $app.load.releaseAsset(texture, lifeTarget)
    }
    if (!series.isLast(token)) return//时序不对return
    this.setTexture(texture2D, texture2DParams.rect, texture2DParams.rotated, texture2DParams.offset, texture2DParams.originalSize)
}
SafeAsync(cc.SpriteFrame.prototype, "setAutoTexture", Object.getOwnPropertyDescriptor(cc.SpriteFrame.prototype, 'setAutoTexture'))


/** 创建像素级点击处理函数 */
function createPixelHandler<T extends Function>(
    node: cc.Node,
    callback: T,
    target: any,
    thresholdOpcaity: number = 10
): (event: cc.Event.EventTouch) => void {
    return (event: cc.Event.EventTouch) => {
        $app.view.renderPixelCamare.enabled = true
        const clickPos = event.getLocation()
        const buffer = $app.view.renderPixelTexture.readPixels(null, clickPos.x, clickPos.y, 1, 1)
        const opacity = buffer[3]
        $app.timer.scheduleOnce(node, () => {
            $app.view.renderPixelCamare.enabled = false
            if (thresholdOpcaity >= opacity) return
            callback.call(target, event)
        }, 0)
    }
}

cc.Node.prototype.onPixel = function <T extends Function>(type: string, callback: T, target?: any, thresholdOpcaity?: number, useCapture?: boolean) {
    const handler = createPixelHandler(this, callback, target, thresholdOpcaity)
    return cc.Node.prototype.on.call(this, type, handler, target, useCapture)
}

cc.Node.prototype.onceOnPixel = function <T extends Function>(type: string, callback: T, target?: any, thresholdOpcaity?: number, useCapture?: boolean) {
    const handler = createPixelHandler(this, callback, target, thresholdOpcaity)
    return cc.Node.prototype.once.call(this, type, handler, target, useCapture)
}
cc.Node.prototype.offPixel = function (type: string, callback: Function, target?: any, useCapture?: boolean) {
    return cc.Node.prototype.off.call(this, type, callback, target, useCapture)
}
cc.Node.prototype.getComponentInstallof = function <T extends cc.Component>(type: ConstructorTemplateType<T> | string) {
    const tcomp = this.getComponent?.(type)
    if (tcomp) return tcomp
    let func
    if (typeof (type) === 'string') {
        func = cc.js.getClassByName(type)
    } else
        func = type
    for (let i = 0; i < this._components?.length; ++i) {
        const comp = this._components[i]
        if (isReliableInherited(comp, func)) {
            return comp
        }
    }
    return null;
}
/**
 * 检测​​间接继承​​关系
 * @param child 
 * @param parent 
 * @returns 
 */
export function isReliableInherited(child, parent) {
    return child instanceof parent //简洁且原生支持
        || isInheritedFrom(child, parent);
}
/**
 * 
 * @param child 
 * @param parent 
 * @returns 
 */
function isInheritedFrom(child: any, parent: any): boolean {
    let proto = Reflect.getPrototypeOf(child);
    while (proto) {
        if (proto === parent.prototype) return true;
        proto = Reflect.getPrototypeOf(proto);
    }
    return false;
}
cc.Node.prototype.getComponentOrAdd = function <T extends cc.Component>(type: { prototype: T }) {
    let component = this.getComponent(type)
    if (!component) {
        component = this.addComponent(type)
    }
    return component
}
cc.Node.prototype.getChildComponentByName = function <T extends cc.Component>(childName: string, type: { prototype: T }) {
    const child = this.getChildByName(childName)
    if (!child) return null
    return child.getComponent(type)
}
cc.Component.prototype.getComponentOrAdd = function <T extends cc.Component>(type: { prototype: T }) {
    return cc.Node.prototype.getComponentOrAdd.call(this.node, type)
}
cc.Component.prototype.getChildComponentByName = function <T extends cc.Component>(childName: string, type: { prototype: T }) {
    return cc.Node.prototype.getChildComponentByName.call(this.node, childName, type)
}
cc.Component.prototype.getComponentInstallof = function <T extends cc.Component>(type: { prototype: T }) {
    return cc.Node.prototype.getComponentInstallof.call(this.node, type)
}

////////////////////////////
// const ccTargetMap = new WeakMap(); // 全局弱引用映射
// if (CC_DEV)
//     window["ccTargetMap"] = ccTargetMap
// const thenFunc = Promise.prototype.then
// Promise.prototype.then = function (onFulfilled, onRejected) {
//     const that = this
//     return thenFunc.call(this,
//         function (value) {
//             if (typeof onFulfilled === 'function') {
//                 const targetRef = ccTargetMap.get(that);
//                 if (targetRef && !cc.isValid(targetRef)) {
//                     console.warn('Promise liftTarget Component is invalid, skip then callback')
//                     // onRejected?.("liftTarget this is valid")
//                     ccTargetMap.delete(that)
//                     return;
//                 }
//                 return onFulfilled(value)
//             }
//             return value;
//         },
//         onRejected)
// }
// Promise.prototype.isValid = function (target: cc.Node | cc.Component) {
//     if (!target) return this;
//     ccTargetMap.set(this, target); // 键是 Promise 实例，值是被弱引用的 target
//     return this;
// }


///////////////////
///////////////////

/** 绑定配置类型 */
interface BindConfig {
    propertyName: string;
    classType: any | any[];
}
/** 绑定映射存储常量 */
const BIND_MAP_KEY = Symbol("___bind_map___")
/**
 * 自动绑定节点属性装饰器
 * @param nodeName 节点名称
 * @param classType 组件类型（可选，默认为cc.Node）
 */
export function autoBindAttribute<T = cc.Node>(nodeName: string, classType?: T) {
    return function (target: any, propertyName: string) {
        addBindConfig(target.constructor, nodeName, propertyName, classType);
    }
}
/**
 * 自动绑定多个组件属性装饰器
 * @param nodeName 节点名称
 * @param classTypes 组件类型数组
 */
export function autoBindAttributes(nodeName: string, ...classTypes: any[]) {
    return function (target: any, propertyName: string) {
        addBindConfig(target.constructor, nodeName, propertyName, classTypes);
    }
}
/** 添加绑定配置到类的元数据 */
function addBindConfig(constructor: any, nodeName: string, propertyName: string, classType: any) {
    const bindMap = constructor[BIND_MAP_KEY] || {};
    bindMap[nodeName] = { propertyName, classType };
    constructor[BIND_MAP_KEY] = bindMap;
}
/** 组件过滤器 - 只处理自定义组件 */
function isCustomComponent(comp: any): boolean {
    return comp && !comp.__classname__?.startsWith('cc.');
}
/** 绑定节点属性到组件 */
function bindNodeAttribute(child: cc.Node, bindConfig: BindConfig, targetComponent: any): boolean {
    const { propertyName, classType } = bindConfig;
    // 处理节点类型
    if (!classType || classType === cc.Node) {
        targetComponent[propertyName] = child;
        return true;
    }
    // 处理组件类型
    const types = Array.isArray(classType) ? classType : [classType];
    for (const type of types) {
        const component = child.getComponent(type);
        if (component) {
            targetComponent[propertyName] = component;
            return true;
        }
    }
    // 开发环境下检查组件是否存在
    if (CC_DEV) {
        clog.warn(`组件未找到 - 节点: ${child.name}, 类型: ${types.map(t => t.name).join(', ')}`);
    }
    return false;
}
/** 在节点树中查找并绑定配置的属性 */
function findAndBindNodes(rootNode: cc.Node, bindMap: Record<string, BindConfig>, targetComponent: any) {
    const remainingConfigs = { ...bindMap };
    const traverse = (node: cc.Node) => {
        // 检查当前节点是否匹配配置
        const config = remainingConfigs[node.name];
        if (config) {
            if (bindNodeAttribute(node, config, targetComponent)) {
                delete remainingConfigs[node.name];
            }
        }
        // 如果所有配置都已绑定，提前终止遍历
        if (Object.keys(remainingConfigs).length === 0) {
            return false;
        }
        // 继续遍历子节点
        return true;
    };
    // 使用深度优先遍历
    const traverseDFS = (node: cc.Node): boolean => {
        if (!traverse(node)) return false;
        for (const child of node.children) {
            if (!traverseDFS(child)) return false;
        }
        return true;
    };
    traverseDFS(rootNode);
}
/** 处理组件的自动绑定 */
function processComponentBinding(node: cc.Node, component: any) {
    const bindMap = component.constructor[BIND_MAP_KEY];
    if (!bindMap || component.__is_attr_bound__) return;
    component.__is_attr_bound__ = true;
    findAndBindNodes(node, bindMap, component)
}
// 重写场景加载逻辑
const originalSceneLoad = cc.Scene.prototype["_load"]
cc.Scene.prototype["_load"] = function () {
    originalSceneLoad.apply(this, arguments);
    this.walk((node: any) => {
        const customComponents = (node._components || []).filter(isCustomComponent);
        customComponents.forEach(comp => processComponentBinding(node, comp));
    });
};
// 重写组件添加逻辑
const originalAddComponent = cc._BaseNode.prototype.addComponent;
cc._BaseNode.prototype.addComponent = function (componentType: any) {
    const component = originalAddComponent.call(this, componentType);
    if (isCustomComponent(component)) {
        processComponentBinding(this, component);
    }

    return component;
};
// 重写实例化逻辑
const originalInstantiate = cc.instantiate;
cc.instantiate = function (node: any) {
    const instance = originalInstantiate(node);
    if (instance instanceof cc.Node) {
        instance.walk((childNode: any) => {
            const customComponents = (childNode._components || []).filter(isCustomComponent);
            customComponents.forEach(comp => processComponentBinding(childNode, comp));
        }, null)
    }
    return instance;
};
// 保留原始克隆方法
cc.instantiate["_clone"] = originalInstantiate["_clone"]

////////////////////