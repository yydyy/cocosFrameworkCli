// @FilePath: PixelButtonThresholdOpcaity.ts
/*
 * @Author: yyd
 * @Date: 2024-04-08 19:06:55
 * @LastEditTime: 2025-04-09 10:57:34
 * @FilePath: \cocosTools\assets\Script\Extend\ui\PixelButtonThresholdOpcaity.ts
 * @Description:  像素按钮组件的透明度阈值
 */

const { ccclass, disallowMultiple, menu, inspector, property } = cc._decorator
@ccclass
@disallowMultiple
export default class PixelButtonThresholdOpcaity extends cc.Component {
    @property
    private _thresholdOpcaity: number = 10
    @property
    get thresholdOpcaity() {
        return this._thresholdOpcaity
    }
    set thresholdOpcaity(value: number) {
        this._thresholdOpcaity = value
    }
}