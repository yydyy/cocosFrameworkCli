// @FilePath: BaseTemplate.ts
/*
 * @Author: yyd
 * @Date: 2024-04-13 20:42:48
 * @LastEditTime: 2026-02-26 22:55:23
 * @FilePath: \cocosTools\assets\Script\Extend\Base\BaseTemplate.ts
 * @Description:  基础模版类
 */

import { Dispatch } from "../core/Dispatch"
import { BaseState } from "./BaseState"

// const { ccclass } = cc._decorator;
// @ccclass
export class BaseTemplate extends BaseState {
    private _dispatch: InstanceType<typeof Dispatch>
    /**子模型 */
    private _children = new Map<BaseType, BaseTemplate>()

    /**模块派发 */
    get dispatch() {
        this._dispatch = this._dispatch || new Dispatch()
        return this._dispatch
    }

    constructor(id: BaseType, ...args: any[]) {
        super(id, ...args)
        this.init(...args)
    }
    /**初始化函数，用于设置模型的初始状态 */
    init(...args: any[]) {
        if (this.state > 0) {
            return
        }
        clog.model(this.constructor.name + "初始化")
        super.init(...args)
        this.registerHandler()
    }

    /**
     * 深度克隆（完整复制所有数据，包括内部状态）
     * @param newId 新id（可选，不传则保留原id）
     * @param newOnlyId 指定onlyId（可选，不传则由getter懒加载生成新的）
     */
    clone<T extends BaseTemplate = BaseTemplate>(newId?: BaseType, newOnlyId?: number): T {
        const Clazz = this.constructor as ConstructorTemplateType<T>;
        const clone = Object.create(Clazz.prototype) as T;

        for (const key of Object.keys(this)) {
            if (key === '_onlyId') {
                // onlyId：指定则用指定值，否则跳过（getter懒加载生成新的）
                if (newOnlyId !== undefined) {
                    clone[key] = newOnlyId;
                }
                continue;
            }
            if (key === '_id') {
                // id：指定则用新id，否则保留原id
                clone[key] = newId !== undefined ? newId : this[key];
                continue;
            }
            if (key === '_children') {
                // 递归克隆子模型
                const newChildren = new Map<BaseType, BaseTemplate>();
                this._children.forEach((child: BaseTemplate, cId: BaseType) => {
                    newChildren.set(cId, child.clone(cId));
                });
                clone[key] = newChildren;
                continue;
            }
            if (key === '_dispatch') {
                // dispatch 懒加载
                clone[key] = null;
                continue;
            }
            // 其他属性深拷贝
            clone[key] = $app.tool.clone(this[key], true);
        }
        return clone;
    }
    /**
     * 获取子模型
     * @param cId 子模型id
     * @param classCtor 子模型类
     * @returns 
     */
    getChild<T extends BaseTemplate>(cId: BaseType, classCtor?: ConstructorTemplateType<T>) {
        return this._children.get(cId) as T
    }
    /**
     * 遍历模型，执行函数
     * @param func 执行函数
     */
    public travelDo<T extends BaseTemplate>(func: (child: T, id: BaseType) => void | boolean) {
        $forEach((child: T, id: BaseType) => {
            // 执行函数，获取返回值  如果返回值存在，则直接返回
            return func(child, id)
        }, this._children, this, true)
    }
    /**
     * 添加子模型
     */
    addChild(child: BaseTemplate) {
        if (child && child.id) {
            this._children.set(child.id, child);
            child.parent = this
        }
    }
    /**
     * 删除子模型
     * @param cId 
     * @param isDestroy 是否销毁子模型
     */
    removeChild(cId: BaseType, isDestroy: boolean = true) {
        const child = this._children.get(cId);
        if (child) {
            child.parent = null;
            this._children.delete(cId);
            if (isDestroy) {
                child.onDestroy();
            }
        }
    }
    /**注册事件处理 */
    protected registerHandler() {

    }
    /**注销模块派发0 */
    targetOff(target?: object) {
        this._dispatch?.targetOff(target)
    }
    /**注销模块派发1 */
    idOff(id: BaseType): void {
        this._dispatch.idOff(id)
    }
    /**注销事件处理 */
    protected unregisterHandler() {
        $app.dispatch.targetOff(this)
        this.targetOff(this)
    }
    /**销毁模型 */
    onDestroy() {
        super.onDestroy()
        this.unregisterHandler()
        this._dispatch = null
        this._children.forEach((child) => {
            if (child) {
                child.parent = null
                child.onDestroy?.();
            }
        });
        // 清除模型的子模型
        this._children.clear()
    }
}