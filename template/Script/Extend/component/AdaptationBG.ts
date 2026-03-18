
// @FilePath: AdaptationBG.ts

/*
 * @Author: yyd
 * @Date: 2024-09-29 16:56:12
 * @LastEditTime: 2025-04-23 15:41:12
 * @FilePath: \cocosTools\assets\Script\Extend\AdaptationBG.ts
 * @Description:  bg适配
 */

const { ccclass, property, menu } = cc._decorator;


@ccclass
@menu("通用/背景适配")
export default class AdaptationBG extends cc.Component {

    protected onLoad() {
        // //获取屏幕的宽高比和背景图片的宽高比
        let screen = cc.view.getFrameSize()
        let screenRatio: number = screen.width / screen.height;
        let bgRatio: number = this.node.width / this.node.height;
        $app.uiTool.nextFrame(() => {
            // 比较两者的宽高比，按需要调整背景图片的scale
            if (screenRatio > bgRatio) {
                // 屏幕比背景图片更宽，需等宽适配
                this.node.scale = cc.winSize.width / this.node.width;
            } else {
                // 屏幕比背景图片更高，需等高适配
                this.node.scale = cc.winSize.height / this.node.height;
            }
        }, this)
        // let srcScaleForShowAll = Math.min(cc.view.getCanvasSize().width / this.node.width, cc.view.getCanvasSize().height / this.node.height);
        // let realWidth = this.node.width * srcScaleForShowAll;
        // let realHeight = this.node.height * srcScaleForShowAll;

        // // 2. 基于第一步的数据，再做缩放适配
        // this.node.scale = Math.max(cc.view.getCanvasSize().width / realWidth, cc.view.getCanvasSize().height / realHeight);
        // console.log("size2", this.node.scale)
    }
}
