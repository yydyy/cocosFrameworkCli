// @FilePath: ScreenShotBase.ts
/*
 * @Author: yyd
 * @Date: 2025-02-17 10:57:01
 * @LastEditTime: 2025-04-17 11:58:27
 * @FilePath: \cocosTools\assets\Script\Extend\ui\screenShot\ScreenShotBase.ts
 * @Description:  截图基类
 */

export class ScreenShotBase {
    protected _canvas: any = null
    protected _texture: cc.RenderTexture = null
    protected _callback: Function = null
    protected _width: number = 0
    protected _height: number = 0

    camera: cc.Camera = null

    init(camera: cc.Camera, callback: Function) {
        this.camera = camera
        this._callback = callback
        let texture = new cc.RenderTexture();
        //@ts-ignore        如果截图包含mask组件需要传递第三个参数  cc.gfx.RB_FMT_S8
        texture.initWithSize(cc.visibleRect.width, cc.visibleRect.height, cc.gfx.RB_FMT_S8);
        this.camera.targetTexture = texture;
        this._texture = texture;
        this.camera.render();
        return texture
    }

    // create the img element
    createImg() {
        // return the type and dataUrl
        var dataURL = this._canvas.toDataURL("image/png");
        var img = document.createElement("img");
        img.src = dataURL;
        return img;
    }
    // create the canvas and context, filpY the image Data
    createCanvas(...args) {
        let width = this._texture.width;
        let height = this._texture.height;
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');

            this._canvas.width = width;
            this._canvas.height = height;
        }
        else {
            this.clearCanvas();
        }
        let ctx = this._canvas.getContext('2d');
        let data = this._texture.readPixels();
        // write the render data
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let imageData = ctx.createImageData(width, 1);
            let start = srow * width * 4;
            for (let i = 0; i < rowBytes; i++) {
                imageData.data[i] = data[start + i];
            }

            ctx.putImageData(imageData, 0, row);
        }
        return this._canvas;
    }
    captureAction(capture, width, height) {
        const tag = capture.scaleY > 0 ? 1 : -1
        let scaleAction = cc.scaleTo(1, 0.3, 0.3 * tag);
        let targetPos = cc.v2(width - width / 6, height / 4);
        let moveAction = cc.moveTo(1, targetPos);
        let spawn = cc.spawn(scaleAction, moveAction);
        capture.runAction(spawn);
        $app.uiTool.nextFrame(() => {
            this.camera.enabled = false;
        })
        // let blinkAction = cc.blink(0.1, 1);
        // // scene action
        // this.node.runAction(blinkAction);
    }

    // show on the canvas
    showImage(img) {
        let texture = new cc.Texture2D();
        texture.initWithElement(img);

        let spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(texture);

        let node = new cc.Node();
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
            node.destroy();
            $app.view.node.removeChild($app.view.node.getChildByName("sceenShot"))
        });

        this.captureAction(node, width, height);
    }

    clearCanvas() {
        let ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
}