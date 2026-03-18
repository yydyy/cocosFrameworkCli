// @FilePath: UITools.ts

/*
 * @Author: yyd
 * @Date: 2024-08-05 16:35:01
 * @LastEditTime: 2025-11-21 15:53:46
 * @FilePath: \cocosTools\assets\Script\ui\UITools.ts
 * @Description:  常用的ui工具类
 */

export const UITools = $gb.SingleFunc(
    class UITools {
        /**
        * 递归T类型的组件
        * @param node
        * @param type
        * @param callBack
        */
        traveDoScript<T extends cc.Component>(node: cc.Node, type: ConstructorTemplateType<T>, callBack: (classMe: T) => void) {
            const recursiveTraverse = (currentNode: cc.Node) => {
                const script = currentNode.getComponent(type)
                if (script) {
                    callBack(script)
                }
                $forEach((childNode: cc.Node) => {
                    recursiveTraverse(childNode)
                }, currentNode.children, this)
            }
            recursiveTraverse(node)
        }

        /**
         * 给 node 添加按钮事件（通过脚本名字）
         * @param params.node 按钮节点
         * @param params.targetNode 脚本所属的节点（回调 this 指向）
         * @param params.targetScript 脚本名字 script["__classname__"]
         * @param params.clickFuncName 回调函数名字
         * @param params.indexEvent 回调下标索引（默认 0）
         * @param params.customEventData 回调参数
         * @param params.transition 按钮过渡效果
         */
        addNodeBtnEvent(params: {
            node: cc.Node, targetNode: cc.Node, targetScript: string, clickFuncName: string,
            indexEvent?: number, customEventData?: string, transition?: cc.Button.Transition,
        }) {
            const { node, targetNode, targetScript, clickFuncName, indexEvent = 0, customEventData, transition } = params;
            const btn = this._ensureButton(node, transition);
            btn.clickEvents[indexEvent] = this._createEventHandler(targetNode, targetScript, clickFuncName, customEventData);
        }
        /**
         * 给按钮添加事件（通过脚本实例）
         * @param params.targetNode 按钮节点
         * @param params.script 脚本实例（自动获取 node 和 __classname__）
         * @param params.clickFuncName 回调函数名字
         * @param params.indexEvent 回调下标索引（默认 0）
         * @param params.customEventData 回调参数
         * @param params.transition 按钮过渡效果
         */
        addNodeBtnEventByScript(params: {
            targetNode: cc.Node, script: cc.Component, clickFuncName: string,
            indexEvent?: number, customEventData?: string, transition?: cc.Button.Transition,
        }) {
            const { targetNode, script, clickFuncName, indexEvent = 0, customEventData, transition } = params;
            const btn = this._ensureButton(targetNode, transition);
            btn.clickEvents[indexEvent] = this._createEventHandler(script.node, script["__classname__"], clickFuncName, customEventData);
        }

        /** 获取或创建按钮组件 */
        private _ensureButton(node: cc.Node, transition?: cc.Button.Transition): cc.Button {
            let btn = node.getComponent(cc.Button);
            if (!btn) {
                btn = node.addComponent(cc.Button);
                btn.target = node;
                btn.transition = transition ?? cc.Button.Transition.NONE;
                btn.duration = 0.1;
                btn.zoomScale = 1.1;
            }
            return btn;
        }
        /** 创建事件处理器 */
        private _createEventHandler(targetNode: cc.Node, componentName: string, handler: string, customEventData?: string): cc.Component.EventHandler {
            const eventHandler = new cc.Component.EventHandler();
            eventHandler.target = targetNode;
            eventHandler.component = componentName;
            eventHandler.handler = handler;
            eventHandler.customEventData = customEventData || "";
            return eventHandler;
        }
        /**
         * 颜色转换
         * @param hexStr 
         * @returns 
         */
        hexToCcColor(hexStr: string): cc.Color {
            hexStr = hexStr.replace(/^#/, '');
            const r = parseInt(hexStr.substring(0, 2), 16);
            const g = parseInt(hexStr.substring(2, 4), 16);
            const b = parseInt(hexStr.substring(4, 6), 16);
            return cc.color(r, g, b);
        }

        // ============ 定时器相关（委托给 TimerMgr）============

        /**
         * 真实的下一帧执行
         * @param callback 回调函数
         * @param target 当前组件（可选，用于生命周期管理）
         */
        nextFrame(callback: () => void, target?: cc.Component) {
            if (target) {
                target.scheduleOnce(callback, 0)
            } else {
                $app.timer.scheduleOnce(null, callback, 0)
            }
        }

        /**
         * 按 key 调度一次性延迟任务（防重复）
         * @param key 任务唯一标识（最好为类名+类型）
         * @param callback 回调函数
         * @param delay 延迟时间（秒）
         */
        scheduleOnce(key: string | symbol, callback: () => void, delay?: number) {
            $app.timer.scheduleOnceByKey(key, callback, delay)
        }

        /**
         * 按 key 调度定时任务（防重复）
         * @param key 任务唯一标识（最好为类名+类型）
         * @param callback 回调函数
         * @param interval 间隔时间（秒）
         * @param isOnce 是否只运行一次
         */
        schedule(key: string | symbol, callback: () => void, interval: number = 0, isOnce: boolean = false) {
            $app.timer.scheduleByKey(key, callback, interval, isOnce)
        }

        /**
         * 按 key 取消任务
         * @param key 任务标识
         * @returns 是否成功取消
         */
        unschedule(key: string | symbol): boolean {
            return $app.timer.unscheduleByKey(key)
        }

        /**
         * 判断 key 是否存在
         * @param key 任务标识
         */
        hasSchedule(key: string | symbol): boolean {
            return $app.timer.hasKey(key)
        }

        /**
         * 清除所有按 key 注册的延时任务
         */
        unAllschedule() {
            $app.timer.unscheduleAllKeys()
        }
    })