// @FilePath: SceenShotNative.ts
/*
 * @Author: yyd
 * @Date: 2024-04-11 10:09:39
 * @LastEditTime: 2025-04-17 11:58:45
 * @FilePath: \cocosTools\assets\Script\Extend\ui\screenShot\SceenShotNative.ts
 * @Description:  截图功能 native
 */


import { ScreenShotBase } from "./ScreenShotBase";

export class ScreenShotNative extends ScreenShotBase {

    init(camera: cc.Camera, callback: Function) {
        const texture = super.init(camera, callback)
        const spriteFrame = new cc.SpriteFrame(texture);
        clog.warn("开始渲染截图~")
        const picData = this.initImage();
        this.createCanvas(picData, spriteFrame);
        // camera.enabled = false;
        this.saveFile(picData)
        return null
    }

    initImage() {
        let data = this._texture.readPixels();
        this._width = this._texture.width;
        this._height = this._texture.height;
        let picData = this.filpYImage(data, this._width, this._height);
        return picData;
    }

    saveFile(picData) {
        if (CC_JSB) {
            let filePath = jsb.fileUtils.getWritablePath() + 'sceen_shot_img.png';
            //@ts-ignore
            let success = jsb.saveImageData(picData, this._width, this._height, filePath)
            if (success) {
                clog.log("save image data success, file: " + filePath);
                this._callback?.(filePath)
            }
            else {
                clog.error("save image data failed!");
            }
        }
    }

    createCanvas(picData, spriteFrame) {
        // let texture = new cc.Texture2D();
        // texture.initWithData(picData, 32, this._width, this._height);

        // let spriteFrame = new cc.SpriteFrame();
        // spriteFrame.setTexture(texture);

        let node = new cc.Node();
        node.scaleY = -1
        let sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteFrame;

        node.zIndex = cc.macro.MAX_ZINDEX;
        node.parent = cc.director.getScene();
        // set position
        let width = cc.winSize.width;
        let height = cc.winSize.height;
        node.x = width / 2;
        node.y = height / 2;
        node.on(cc.Node.EventType.TOUCH_START, () => {
            $app.view.node.removeChild($app.view.node.getChildByName("sceenShot"))
            node.destroy();
        });

        this.captureAction(node, width, height);
    }

    // This is a temporary solution
    filpYImage(data, width, height) {
        // create the data array
        let picData = new Uint8Array(width * height * 4);
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let start = srow * width * 4;
            let reStart = row * width * 4;
            // save the piexls data
            for (let i = 0; i < rowBytes; i++) {
                picData[reStart + i] = data[start + i];
            }
        }
        return picData;
    }
}