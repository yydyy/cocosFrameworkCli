// @FilePath: NumberChangeAni.ts
/*
 * @Author: yyd
 * @Date: 2024-04-08 19:06:55
 * @LastEditTime: 2026-01-01 17:34:10
 * @FilePath: \cocosTools\assets\Script\Extend\ui\NumberChangeAni.ts
 * @Description:  数字变动动画组件 
 */

import BaseLogic from "../Base/BaseLogic";

const { ccclass, menu, property } = cc._decorator

@ccclass
@menu("自定义组件/NumberChangeAni")
export default class NumberChangeAni extends BaseLogic {
    @property(cc.Node)
    labNode: cc.Node = null

    private _decimalPlaces = 0; // 新增小数位数控制
    private _target: cc.Label = null

    set string(v: string | number) {
        if (!this._target) {
            clog.warn("NumberChangeAni组件的_target节点未找到!")
            return
        }
        this._target.string = this._formatNumber(v)
    }

    __preload() {
        this._target = this.labNode?.getComponent(cc.Label) || this.getComponent(cc.Label)
    }

    /** 获取小数位数 */
    private _getDecimalPlaces(num: number): number {
        const str = num.toString()
        const decimalIndex = str.indexOf('.')
        return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1
    }
    /** 格式化数字输出 */
    private _formatNumber(value: number | string): string {
        const num = typeof value === 'string' ? parseFloat(value) : value
        return num.toFixed(this._decimalPlaces).replace(/(\.0+$|(?<=\.\d+?)0+$)/, '')
    }

    /**
     * 设置最终显示
     * @param v 
     */
    set finallyString(v: number | string) {
        cc.Tween.stopAllByTarget(this._target.node)
        this.string = v
    }

    /**
     * 初始化动画
     * @param startNum 开始数字
     * @param endNum 结束数字
     * @param duration 动画持续时间  如果时间为0 将直接变化为endNum
     * @param callBack 动画结束回调
     */
    init(startNum: number, endNum: number, duration: number, callBack?: Function) {
        super.init(0)
        cc.Tween.stopAllByTarget(this._target.node)
        // 计算小数位数
        this._decimalPlaces = Math.max(
            this._getDecimalPlaces(startNum),
            this._getDecimalPlaces(endNum)
        )

        if (duration === 0) {
            this.string = endNum.toString()
            callBack?.()
            return
        }
        const interval = 0.05 // 保持50ms更新间隔
        const totalSteps = Math.round(duration / interval)
        const stepSize = (endNum - startNum) / totalSteps
        let currentStep = 0
        let currentValue = 0
        this.string = startNum
        cc.tween(this._target.node)
            .repeat(totalSteps, cc.tween()
                .delay(interval)
                .call(() => {
                    currentStep++
                    currentValue = stepSize * currentStep
                    this.string = startNum + currentValue
                }))
            .call(() => {
                this.string = endNum; // 确保最终值准确
                callBack?.()
            })
            .start()
    }
}