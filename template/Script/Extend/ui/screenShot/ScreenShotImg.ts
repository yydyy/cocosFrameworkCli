// @FilePath: ScreenShotImg.ts
/*
 * @Author: yyd
 * @Date: 2024-04-11 10:09:39
 * @LastEditTime: 2025-03-24 17:15:53
 * @FilePath: \cocosTools\assets\Script\Extend\ui\screenShot\ScreenShotImg.ts
 * @Description:  截图功能
 */

import { autoBindAttribute } from "../../prototype/Deserialize";
import { ScreenShotNative } from "./SceenShotNative";
import { ScreenShotWeb } from "./SceenShotWeb";
import { SceenShotWechat } from "./SceenShotWechat";


const { ccclass, property } = cc._decorator;

@ccclass
export default class ScreenShotImg extends cc.Component {
    @autoBindAttribute("camera", cc.Camera)
    camera: cc.Camera

    init(callBack: Function) {
        let funcName = null
        if ($app.platform.isAndroid || $app.platform.isIos) {
            funcName = "native"
        }
        else if ($app.platform.isWechat_game) {
            funcName = "wechat"
        } else {//web
            funcName = "web"
        }
        const table = {
            "native": ScreenShotNative,
            "wechat": SceenShotWechat,
            "web": ScreenShotWeb,
        }
        const script = new table[funcName]()
        script.init(this.camera, callBack)
    }
}

