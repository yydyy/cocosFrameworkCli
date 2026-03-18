// @FilePath: SceenShotWechat.ts

/*
 * @Author: yyd
 * @Date: 2024-04-11 10:09:39
 * @LastEditTime: 2025-02-18 11:04:48
 * @FilePath: \trunk\assets\script\common\screenShot\SceenShotWechat.ts
 * @Description:  截图功能 wechat
 */

import { ScreenShotBase } from "./ScreenShotBase";

export class SceenShotWechat extends ScreenShotBase {
    init(camera: cc.Camera, callback: Function) {
        super.init(camera, callback)
        const canvas = this.createCanvas()
        this.createImg();
        this.saveFile(canvas);
        return null
    }

    saveFile(tempCanvas: any) {
        // This is one of the ways that could save the img to your local.
        if ($app.platform.isWechat_game) {
            const data = {
                x: 0,
                y: 0,
                width: this._canvas.width,
                height: this._canvas.height,
                // destination file sizes
                destWidth: this._canvas.width,
                destHeight: this._canvas.height,
                fileType: 'png',
                quality: 1
            }
            // https://developers.weixin.qq.com/minigame/dev/api/render/canvas/Canvas.toTempFilePathSync.html
            let _tempFilePath = tempCanvas.toTempFilePathSync(data);
            clog.log(`Capture file success!${_tempFilePath}`);
            // https://developers.weixin.qq.com/minigame/dev/api/media/image/wx.previewImage.html
            // wx.previewImage({
            //     urls: [_tempFilePath],
            //     success: (res) => {
            //         LogFunc.log('Preview image success.');
            //         this._callback?.()
            //     }
            // })
            wx.shareAppMessage({
                imageUrl: _tempFilePath
            })
        }
        else {
            clog.error('该样例只支持微信小游戏平台');
        }
    }
}
