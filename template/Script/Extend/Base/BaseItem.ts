// @FilePath: BaseItem.ts
/*
 * @Author: yyd
 * @Date: 2024-07-06 20:51:36
 * @LastEditTime: 2026-02-01 23:16:31
 * @FilePath: \cocosTools\assets\Script\Extend\Base\BaseItem.ts
 * @Description:  基础item类
 */

import BaseLogic from "./BaseLogic";

export type DelegateFuncType = (item: BaseItem, index: BaseType, args: any) => void
const { ccclass } = cc._decorator;

@ccclass
export class BaseItem extends BaseLogic {
    private _delegateFunc: DelegateFuncType//点击回调函数
    private _args: any//自主传递的参数
    private _index: BaseType

    set parent(parent: cc.Node | cc.Component) {
        super.parent = parent
    }

    init(index: BaseType, ...args: any[]): void {
        super.init(index, ...args);
        this._index = index
    }

    get index(): BaseType {
        return this._index
    }

    /**
     * 设置回调
     * @param delegateFunc 
     */
    setDelegateFunc(delegateFunc: DelegateFuncType): void {
        this._delegateFunc = delegateFunc;
    }
    /**
     * 设置参数
     * @param param 
     */
    setArgs(param: any) {
        this._args = param
    }
    /**点击 */
    onClickMe(event: cc.Event, args: string): void {
        const parent = this.getParent()
        if (this._delegateFunc) {
            return this._delegateFunc.call(parent, this, this.index, this._args ?? args);
        }
        if (!parent.onClickItem) {
            clog.view("parent's onClickItem is null")
        }
        parent.onClickItem?.call(parent, this, this.index, this._args ?? args);
    }

    onDestroy(): void {
        this._delegateFunc = null;
        this._args = null;
        this._index = null;
        super.onDestroy();
    }
}