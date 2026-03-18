// @FilePath: PixelButton.ts
/*
 * @Author: yyd
 * @Date: 2024-04-08 19:06:55
 * @LastEditTime: 2025-11-21 15:42:55
 * @FilePath: \cocosTools\assets\Script\Extend\ui\PixelButton.ts
 * @Description:  像素按钮组件
 */

import PixelButtonThresholdOpcaity from "./PixelButtonThresholdOpcaity"

const { ccclass, disallowMultiple, menu, inspector, property } = cc._decorator

@ccclass
@menu("自定义组件/PixelButton")
@disallowMultiple
@inspector("packages://inspector/inspectors/comps/button.js")
export default class PixelButton extends cc.Button {
    @property
    private _thresholdOpcaityClass: PixelButtonThresholdOpcaity = null
    protected resetInEditor(): void {
        this._thresholdOpcaityClass = this.getComponentOrAdd(PixelButtonThresholdOpcaity)
    }
    get thresholdOpcaity() {
        return this._thresholdOpcaityClass.thresholdOpcaity
    }

    private async _checkHit(event: cc.Event.EventTouch) {
        $app.view.renderPixelCamare.enabled = true
        const clickPos = event.getLocation()
        const buffer = $app.view.renderPixelTexture.readPixels(null, clickPos.x, clickPos.y, 4, 4)
        const opacity = buffer[3]
        // clog.warn("坐标", Math.round(clickPos.x), " ", Math.round(clickPos.y), " data:", opacity)
        await this.wait()
        return this.thresholdOpcaity <= opacity
    }
    async _onTouchBegan(event: cc.Event.EventTouch) {
        if (!(await this._checkHit(event))) return
        //@ts-ignore
        super._onTouchBegan(event)
    }
    async _onTouchMove(event: cc.Event.EventTouch) {
        if (!(await this._checkHit(event))) return
        //@ts-ignore
        super._onTouchMove(event)
    }
    async _onTouchEnded(event: cc.Event.EventTouch) {
        if (!(await this._checkHit(event))) return
        //@ts-ignore
        super._onTouchEnded(event)
    }

    async wait(time: number = 0) {
        return new Promise(resolve => {
            this.scheduleOnce(() => {
                $app.view.renderPixelCamare.enabled = false
                resolve(void 0)
            }, time)
        }).catch(() => {
            $app.view.renderPixelCamare.enabled = false
        })
    }
}