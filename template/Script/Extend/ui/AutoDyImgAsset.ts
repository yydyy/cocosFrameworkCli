// @FilePath: AutoDyImgAsset.ts
/*
 * @Author: yyd
 * @Date: 2024-04-11 10:09:39
 * @LastEditTime: 2025-05-13 20:01:04
 * @FilePath: \cocosTools\assets\Script\Extend\ui\AutoDyImgAsset.ts
 * @Description: 与sprite等带spriteFrame组件一起 ,  方便 AutoDyImgMgr 管理的组件
 */


const { ccclass, property } = cc._decorator;

@ccclass
export default class AutoDyImgAsset extends cc.Component {
    /**动态key */
    @property
    private _dyKey: BaseType = ""
    @property
    get dyKey() {
        return this._dyKey
    }
    set dyKey(k: BaseType) {
        this._dyKey = k
        if (CC_EDITOR) return

    }

    get sprite() {
        return this.getComponent(cc.Sprite)
    }
    get spriteFrame() {
        return this.sprite?.spriteFrame
    }

    protected onDestroy(): void {

    }
}
