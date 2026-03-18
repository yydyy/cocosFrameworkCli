/*
 * @Author: yyd
 * @Date: 2025-04-17 12:00:32
 * @LastEditTime: 2026-03-14 19:57:35
 * @FilePath: \cocosTools\assets\Script\Extend\ui\PromptBoxView.ts
 * @Description:  
 */
import BaseCtrl from "../Base/BaseCtrl";
import { BaseView } from "../Base/BaseView";
// import {type UiIdType } from "../Base/UiDefines";
import { autoBindAttribute } from "../prototype/Deserialize";
import { PromptBoxType } from "../mgr/ViewMgr";
import { UiId, UiZdxType, WindowType } from "../Base/UiDefines";
import { Bundles } from "../Base/Bundles";

const { ccclass, disallowMultiple, menu, inspector, property } = cc._decorator
@ccclass
@disallowMultiple
@$gb.registerView({
    uid: UiId.PromptBoxView,
    path: "common.view/PromptBoxView",
    bundle: Bundles.common,
    windowType: WindowType.Dialog,
    zdx: UiZdxType.default,
})
export default class PromptBoxView extends BaseView {
    /**标题 */
    @autoBindAttribute("title", cc.Label)
    title: cc.Label = null;
    /**内容 */
    @autoBindAttribute("desc", cc.Label)
    desc: cc.Label = null;
    /**左边按钮 */
    @autoBindAttribute("$btnoLeftBtn")
    $btnoLeftBtn: cc.Node = null;
    /**右边按钮 */
    @autoBindAttribute("$btnonRightBtn")
    $btnonRightBtn: cc.Node = null;
    /**中间按钮 */
    @autoBindAttribute("$btnonMidBtn")
    $btnonMidBtn: cc.Node = null;
    /**左边按钮文字 */
    @autoBindAttribute("leftStr", cc.Label)
    leftStr: cc.Label = null
    /**右边按钮文字 */
    @autoBindAttribute("rightStr", cc.Label)
    rightStr: cc.Label = null
    /**中间按钮文字 */
    @autoBindAttribute("midStr", cc.Label)
    midStr: cc.Label = null
    //
    private _param: PromptBoxType = null
    //
    init(uid: UiIdType, ctrl: CtrlIdType | BaseCtrl, param: PromptBoxType): void {
        super.init(uid, ctrl)
        this._param = param
        this.title.string = param.title
        this.desc.string = param.msg

        if (param.midBtnStr) {
            this.$btnonMidBtn.active = true
            this.midStr.string = param.midBtnStr
            this.$btnoLeftBtn.active = this.$btnonRightBtn.active = false
        } else {
            this.$btnonMidBtn.active = false
            this.$btnoLeftBtn.active = this.$btnonRightBtn.active = true
            this.rightStr.string = param.rightBtnStr || "确定"
            this.leftStr.string = param.leftBtnStr || "取消"
        }
        this._checkIsMutliClose()
    }

    protected start(): void {

    }

    private _checkIsMutliClose() {
        this.close = () => {
            if (this.popupNode && this.isPopAni) {
                cc.tween(this.popupNode)
                    .to(0.2, { scale: 0.3 }, { easing: "backIn" })
                    // 当前面的动作都执行完毕后才会调用这个回调函数
                    .call(() => {
                        this._param.isNew ? $app.view.mutilClose(this.id) : $app.view.close(this.id)
                    })
                    .start()
            } else {
                this._param.isNew ? $app.view.mutilClose(this.id) : $app.view.close(this.id)
            }
        }
    }

    onRightBtn() {
        this._param.rightCallback?.()
        this.close()
    }
    onLeftBtn() {
        this._param.leftCallback?.()
        this.close()
    }
    onMidBtn() {
        this._param.midCallback?.()
        this.close()
    }
}