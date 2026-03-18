// @FilePath: CompontentBase.ts
/*
 * @Author: yyd
 * @Date: 2024-04-28 19:20:06
 * @LastEditTime: 2025-11-21 17:10:10
 * @FilePath: \cocosTools\assets\Script\Extend\Base\ComponentBase.ts
 * @Description:  自动处理btn  
 * 注意 : 注册的按钮事件是有延迟的 ,立马点击会没有反应
 */

import BaseLogic from "./BaseLogic";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ComponentBase extends BaseLogic {
    //解析btn的key
    @property({ tooltip: "解析btn的key" })
    parseBtnKey: string = "$btn"

    init(uid?: BaseType, ...args: any[]) {
        if (this.baseState?.state > 0) return
        const seekBtn = function (node: cc.Node) {
            if (node != null) {
                if (node.name.startsWith(this.parseBtnKey)) {
                    this.addBtn(node);
                }
                for (let i = 0; i < node.children.length; i++) {
                    seekBtn.call(this, node.children[i])
                }
            }
        }
        seekBtn.call(this, this.node)
        super.init(uid, ...args)
    }

    /**
     * 注意:此功能添加的btn有延时的
     * @param node 
     * @returns 
     */
    addBtn(node: cc.Node) {
        let funcName = node.name.replace(this.parseBtnKey, "")
        if (!funcName) return
        const data = funcName.split("_")
        const arr = data[0].split("")
        arr[0] = arr[0].toLocaleLowerCase()
        funcName = arr.join("")
        const func = this[funcName]
        if (typeof func === "function") {
            const btn: cc.Button = node.getComponentOrAdd(cc.Button)
            btn.target = node
            btn.transition = cc.Button.Transition.SCALE
            btn.duration = 0.1
            btn.zoomScale = 1.1

            const event_handler = new cc.Component.EventHandler()
            event_handler.target = this.node
            event_handler.component = this.className
            event_handler.handler = funcName
            event_handler.customEventData = data.length > 1 ? data[1] : ""
            btn.clickEvents[0] = event_handler

            const event_handlerSound = new cc.Component.EventHandler();
            event_handlerSound.target = this.node
            event_handlerSound.component = this.className
            event_handlerSound.handler = "playClickSound"
            btn.clickEvents[1] = event_handlerSound;
        }
    }

    playClickSound() {
        // clog.log("播放点击音效");
    }
}
