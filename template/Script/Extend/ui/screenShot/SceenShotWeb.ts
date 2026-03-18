// @FilePath: SceenShotWeb.ts
/*
 * @Author: yyd
 * @Date: 2024-04-11 10:09:39
 * @LastEditTime: 2025-02-17 11:06:31
 * @FilePath: \trunk\assets\script\common\screenShot\SceenShotWeb.ts
 * @Description:  截图功能 web
 */

import { ScreenShotBase } from "./ScreenShotBase";

export class ScreenShotWeb extends ScreenShotBase {
    init(camera: cc.Camera, callback: Function) {
        super.init(camera,  callback)
        this.createCanvas()
        const img = this.createImg()
        this.showImage(img)
        return null
    }
}