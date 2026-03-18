// @FilePath: App.ts
/*
 * @Author: yyd
 * @Date: 2024-04-13 16:46:10
 * @LastEditTime: 2026-03-07 15:59:57
 * @FilePath: \cocosTools\assets\Script\App.ts
 * @Description:  管理器
 */

// 确保原型扩展和装饰器先加载
import "./bootstrap"

import { Dispatch } from "./Extend/core/Dispatch"
import { Coroutine } from "./Extend/core/Coroutine"
import { cUtile } from "./Extend/utils/cUtile"
import { UITools } from "./Extend/ui/UITools"
import { ViewMgr } from "./Extend/mgr/ViewMgr"
import { CtrlMgr } from "./Extend/mgr/CtrlMgr"
import { PoolsMgr } from "./Extend/mgr/PoolMgr"
import { TimerMgr } from "./Extend/mgr/TimerMgr"
import { PlatformMgr } from "./Extend/mgr/PlatformMgr"
import { MiniLoadTask } from "./Extend/mgr/MiniGameLoad"
import { MultiTextureMgr } from "./multiTexture/MultiTextureMgr"
import type { IAppExtend } from "./Extend/mgr/AppExtend"

const _init = Symbol("init")
class App {
    public view: ViewMgr

    /**
     * 初始化，游戏启动前的准备工作
     */
    [_init]() {
        //@ts-ignore
        cc.internal.inputManager._maxTouches = 1
        cc.macro.ENABLE_WEBGL_ANTIALIAS = true;
        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);
        cc.macro.CLEANUP_IMAGE_CACHE = true //PlatformFunc.isWechat_game;
        cc.dynamicAtlasManager.enabled = false;//目前是单场景 不能合图
    }

    // get load() {
    //     return new LoadMgr()
    // }
    get dispatch() {
        return Dispatch.Ins()
    }
    get tool() {
        return cUtile.Ins()
    }
    get ctrl() {
        return CtrlMgr.Ins()
    }
    get uiTool() {
        return UITools.Ins()
    }
    getCtrl(id: CtrlIdType) {
        return this.ctrl.getCtrl(id)
    }
    get platform() {
        return new PlatformMgr()
    }
    get mulTexture() {
        return MultiTextureMgr.Ins()
    }
    get coroutine() {
        return Coroutine.Ins()
    }
    get pool() {
        return PoolsMgr.Ins()
    }
    /** 统一调度管理器 */
    get timer() {
        return TimerMgr.Ins()
    }
    /**小游戏资源加载队列 非小游戏平台为null*/
    get miniLoadTask() {
        if ($app.platform.isWeb || $app.platform.isNative) {
            return null
        }
        return MiniLoadTask.Ins()
    }
    isOpenViewTest = true
}

window.CONDITION_ASSET = function (condition: boolean, isDebugger: boolean = false, ...args: any[]) {
    if (condition) return
    if (CC_DEV) {
        clog.warn("CONDITION_ASSET check warn:", ...args, "请检测是否是有意的!")
        if (isDebugger) debugger
    }
}

export type AppType = App & IAppExtend

window.$app = new App() as AppType
window.$forEach = $app.tool.forEach.bind($app.tool)
$app[_init]()

