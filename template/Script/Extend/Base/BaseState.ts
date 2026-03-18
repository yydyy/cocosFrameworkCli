// @FilePath: BaseState.ts
/*
 * @Author: yyd
 * @Date: 2024-04-13 20:42:48
 * @LastEditTime: 2026-01-01 20:13:23
 * @FilePath: \cocosTools\assets\Script\Extend\Base\BaseState.ts
 * @Description:  基础状态类
 */

import { getOnlyId } from "./Base";

export class BaseState {
    /** 状态*/
    private _state!: number
    get state() { return this._state }
    /** id */
    private _id: BaseType
    get id() { return this._id }
    /** 父 */
    private _parent: any
    private _onlyId: number

    set parent(value: any) {
        this._parent = value
    }
    getParent<T extends any = any>(type: ConstructorTemplateType<T>): T {
        return this._parent as T
    }

    /**      唯一id     */
    get onlyId() {
        this._onlyId = this._onlyId || getOnlyId()
        return this._onlyId
    }

    constructor(id: BaseType, ...args: any[]) {
        this._id = id;
    }

    /**初始化函数，用于设置模型的初始状态 */
    init(...args: any[]) {
        // 如果模型的状态大于0，则直接返回
        this._state = this._state || 0
        if (this._state > 0) {
            return
        }
        // 设置模型的状态为1
        this._state = 1
    }

    onDestroy() {
        // 设置模型的状态为0
        this._state = 0
        // 设置模型的modelId为null
        this._id = null
        this._parent = null
        this._onlyId = null
    }
}
