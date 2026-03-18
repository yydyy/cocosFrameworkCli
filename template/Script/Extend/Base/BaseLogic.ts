// @FilePath: BaseLogic.ts
/*
 * @Author: yyd
 * @Date: 2024-04-14 09:30:14
 * @LastEditTime: 2026-03-02 10:28:28
 * @FilePath: \cocosTools\assets\Script\Extend\Base\BaseLogic.ts
 * @Description:  logic层基类
 */

import BaseCtrl from "./BaseCtrl"
import { getOnlyId } from "./Base";
import { BaseState } from "./BaseState"

const { ccclass } = cc._decorator;

@ccclass
export default class BaseLogic extends cc.Component {
    private _baseState: BaseState
    private _userData: any
    private _onlyId: number
    private _parent: any  // 独立存储 parent，支持 init 前设置
    /**    控制器 id    */
    ctrlId: CtrlIdType
    /**控制器 */
    private _ctrl: BaseCtrl

    /**脚本名字 */
    get className() {
        return this["__classname__"]
    }

    get id() {
        return this._baseState?.id
    }

    /**      唯一id     */
    get onlyId() {
        this._onlyId = this._onlyId || getOnlyId()
        return this._onlyId
    }
    //状态
    get baseState() { return this._baseState }


    /**用户自定义数据 */
    set userData(value: any) {
        this._userData = value
    }
    getUserData<T extends new (...args: any[]) => any>(type: T): InstanceType<T> {
        return this._userData
    }

    get ctrl() {
        return this.getCtrl()
    }
    set ctrl(ctrl: BaseCtrl) {
        this._ctrl = ctrl
    }

    init(id: BaseType, ...args: any[]) {
        if (this._baseState?.state > 0) return
        this._baseState = new BaseState(id)
        // 同步之前设置的 parent
        if (this._parent != null) {
            this._baseState.parent = this._parent
        }
        this._baseState.init(...args)
        this.registerHandler()
    }

    getCtrl<T extends BaseCtrl = BaseCtrl>(type?: ConstructorTemplateType<T>) {
        if (this._ctrl) {
            return this._ctrl as T
        }
        return $app.ctrl.getCtrl(this.ctrlId) as unknown as T
    }

    getParent<T extends any = any>(type?: ConstructorTemplateType<T>): T {
        return this._parent ?? this._baseState?.parent
    }

    /**设置上层类（可在 init 前调用）*/
    set parent(value: any) {
        this._parent = value
        if (this._baseState) {
            this._baseState.parent = value
        }
    }

    protected registerHandler() {

    }

    protected unregisterHandler() {
        $app.dispatch.targetOff(this)
        const ctrl = this.getCtrl()
        ctrl?.targetOff(this)
    }

    protected onDestroy(): void {
        this._baseState?.onDestroy()
        this._baseState = null;
        this._userData = null;
        this._onlyId = null;
        this._parent = null;
        this._ctrl = null;
        this.ctrlId = null;
        this.unregisterHandler()
    }

}