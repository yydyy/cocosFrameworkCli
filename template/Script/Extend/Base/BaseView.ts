// @FilePath: BaseView.ts
/*
 * @Author: yyd
 * @Date: 2024-07-06 20:33:50
 * @LastEditTime: 2026-01-31 15:48:14
 * @FilePath: \cocosTools\assets\Script\Extend\Base\BaseView.ts
 * @Description:  界面  基类
 */
import BaseCtrl from "./BaseCtrl";
import ComponentBase from "./ComponentBase";
import { dialogLayerName,  } from "./UiDefines";

const { ccclass, property, executeInEditMode, disallowMultiple, menu } = cc._decorator;

@ccclass
@disallowMultiple
export class BaseView extends ComponentBase {
    @property({ displayName: "弹出动画" })
    readonly isPopAni: boolean = false;

    @property({
        type: cc.Node,
        visible() {
            return this.isPopAni
        },
    })
    readonly popupNode: cc.Node = null;

    ///////////////////////dialog///////////////////////////////////////////////////
    /** dialog 单独的遮罩node  在viewMgr中自动添加的 view获取的是null*/
    get singleMaskLayer() {
        return this.node.getChildByName(dialogLayerName)
    }
    /**
     * 设置 dialog 单独的遮罩node 是否可交互 关闭
     * @param dt 
     * @returns 
     */
    setSingleMaskLayerEnable(dt: boolean) {
        if (!this.singleMaskLayer) return
        this.singleMaskLayer.getComponent(cc.Button).interactable = dt
    }
    /**
     *  设置 dialog 单独的遮罩node 的透明度
     * @param df 
     * @returns 
     */
    setSingleMaskLayerOpacity(df: number) {
        if (!this.singleMaskLayer) return
        this.singleMaskLayer.opacity = df
    }
    ///////////////////////dialog///////////////////////////////////////////////////

    get id() {
        return super.id as UiIdType
    }

    __preload() {
        if (this.isPopAni && this.popupNode) {
            this.popupNode.scale = 0.2
            this._runOpenAction(this.popupNode)
        }
    }

    /**
     * 初始化  viewMgr中调用
     * @param uid 
     * @param ctrl 
     * @param args 
     */
    init(uid: UiIdType, ctrl: CtrlIdType | BaseCtrl = null, ...args: any[]): void {
        super.init(uid, ...args)
        if (ctrl) {
            if (ctrl instanceof BaseCtrl) {
                this.ctrl = ctrl
                ctrl?.pushViewId(uid)
            } else {
                this.ctrlId = ctrl
                const baseCtrl = $app.ctrl.getCtrl(ctrl)
                baseCtrl?.pushViewId(uid)
            }
        }
    }
    /**关闭 */
    close() {
        if (this.popupNode && this.isPopAni) {
            cc.tween(this.popupNode)
                .to(0.2, { scale: 0.3 }, { easing: "backIn" })
                // 当前面的动作都执行完毕后才会调用这个回调函数
                .call(() => {
                    $app.view.close(this.id)
                })
                .start()
        } else {
            $app.view.close(this.id)
        }
    }

    private _runOpenAction(acNode: cc.Node, callback?: any) {
        cc.tween(acNode)
            .to(0.2, { scale: 1 }, { easing: 'backOut' })
            .call(() => {
                callback?.()
            })
            .start()
    }

}