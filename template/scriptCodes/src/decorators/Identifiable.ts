// @FilePath: Identifiable.ts
/*
 * @Author: yyd
 * @Date: 2024-04-09 11:27:04
 * @LastEditTime: 2026-03-16 14:21:27
 * @FilePath: \scriptCodes\src\decorators\Identifiable.ts
 * @Description:  唯一 ID 装饰器模块
 */

let onlyId = 1
export function getOnlyId() {
    return onlyId++
}

/**
 * 唯一 ID 类装饰器
 * @param constructor 
 * @returns 
 */
export function Identifiable<T extends new (...args: any[]) => any>(constructor: T) {
    // 设置类名标识
    Object.defineProperty(constructor, "__classname__", {
        value: constructor.name,
        writable: false,
        enumerable: false,
        configurable: true
    })

    // 在原型上定义 onlyId 属性
    Object.defineProperty(constructor.prototype, 'onlyId', {
        get: function (this: any) {
            if (this._onlyId === undefined) {
                this._onlyId = getOnlyId()
            }
            return this._onlyId
        },
        enumerable: true,
        configurable: true
    })

    // 在原型上定义 className 属性
    Object.defineProperty(constructor.prototype, 'className', {
        get: function (this: any) {
            return this["__classname__"] || constructor.name
        },
        enumerable: true,
        configurable: true
    })

    return constructor
}

