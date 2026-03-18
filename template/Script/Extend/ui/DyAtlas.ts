/*
 * @Author: yyd
 * @Date: 2025-05-13 19:34:46
 * @LastEditTime: 2025-05-13 19:59:54
 * @FilePath: \cocosTools\assets\Script\Extend\ui\DyAtlas.ts
 * @Description:  运行时的自动图集
 */
const space = 2
class ImgInfo {
    x: number; y: number; texture: cc.Texture2D
}
export default class DyAtlas {
    private _texture: cc.RenderTexture
    private _x: number
    private _y: number
    private _nexty: number
    private _width: number
    private _height: number
    private _count: number
    private _dirty: boolean
    private _innerTextureInfos: { [i in number | string]: ImgInfo }
    private _innerSpriteFrames: cc.SpriteFrame[]
    
    constructor(widthLike: number | cc.Size | cc.Rect, height?: number) {
        let width = widthLike instanceof Object ? widthLike.width : widthLike
        height = widthLike instanceof Object ? widthLike.height : height

        const texture = new cc.RenderTexture()
        texture.initWithSize(width, height)
        this._texture = texture
        this._x = space;
        this._y = space;
        this._nexty = space;

        this._width = width;
        this._height = height;

        this._innerTextureInfos = {};
        this._innerSpriteFrames = [];

        this._count = 0;
    }

    insertSpriteFrame(spriteFrame: cc.SpriteFrame) {
        let rect = spriteFrame._rect,
            texture = spriteFrame._texture,
            info = this._innerTextureInfos[texture._id];

        let sx = rect.x, sy = rect.y;

        if (info) {
            sx += info.x;
            sy += info.y;
        }
        else {
            let width = texture.width, height = texture.height;

            if ((this._x + width + space) > this._width) {
                this._x = space;
                this._y = this._nexty;
            }

            if ((this._y + height + space) > this._nexty) {
                this._nexty = this._y + height + space;
            }

            if (this._nexty > this._height) {
                return null;
            }

            // texture bleeding
            if (cc.dynamicAtlasManager.textureBleeding) {
                // Smaller frame is more likely to be affected by linear filter
                if (width <= 8 || height <= 8) {
                    this._texture.drawTextureAt(texture, this._x - 1, this._y - 1);
                    this._texture.drawTextureAt(texture, this._x - 1, this._y + 1);
                    this._texture.drawTextureAt(texture, this._x + 1, this._y - 1);
                    this._texture.drawTextureAt(texture, this._x + 1, this._y + 1);
                }

                this._texture.drawTextureAt(texture, this._x - 1, this._y);
                this._texture.drawTextureAt(texture, this._x + 1, this._y);
                this._texture.drawTextureAt(texture, this._x, this._y - 1);
                this._texture.drawTextureAt(texture, this._x, this._y + 1);
            }

            this._texture.drawTextureAt(texture, this._x, this._y);

            this._innerTextureInfos[texture._id] = {
                x: this._x,
                y: this._y,
                texture: texture
            };

            this._count++;

            sx += this._x;
            sy += this._y;

            this._x += width + space;

            this._dirty = true;
        }

        let frame = {
            x: sx,
            y: sy,
            texture: this._texture
        }

        this._innerSpriteFrames.push(spriteFrame);

        return frame;
    }
    update() {
        if (!this._dirty) return;
        //@ts-ignore
        this._texture.update();
        this._dirty = false;
    }
    deleteInnerTexture(texture) {
        if (texture && this._innerTextureInfos[texture._id]) {
            delete this._innerTextureInfos[texture._id];
            this._count--;
        }
    }
    isEmpty() {
        return this._count <= 0;
    }
    reset() {
        this._x = space;
        this._y = space;
        this._nexty = space;

        let frames = this._innerSpriteFrames;
        for (let i = 0, l = frames.length; i < l; i++) {
            let frame = frames[i];
            if (!frame.isValid) {
                continue;
            }
            //@ts-ignore
            frame._resetDynamicAtlasFrame();
        }
        this._innerSpriteFrames.length = 0;
        this._innerTextureInfos = {};
    }
    destroy() {
        this.reset();
        this._texture.destroy();
    }
}