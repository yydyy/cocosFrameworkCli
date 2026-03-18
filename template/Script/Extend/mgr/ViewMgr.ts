// @FilePath: ViewMgr.ts
/*
 * @Author: yyd
 * @Date: 2024-07-07 11:25:50
 * @LastEditTime: 2026-03-14 20:17:22
 * @FilePath: \cocosTools\assets\Script\Extend\mgr\ViewMgr.ts
 * @Description:  page  管理器  直接挂载到scene节点中
 */

import BaseLogic from "../Base/BaseLogic";
import { BaseView } from "../Base/BaseView";
import { GameEvents } from "../Base/Events";
import { IViewState, UiId, UiZdxType, WindowType, dialogLayerName, toastPrefabPath, getUiDefined, viewNodeParentName, viewToastParentName } from "../Base/UiDefines";

import { ReleaseType } from "./ReleaseType";

const { ccclass, property, menu, disallowMultiple } = cc._decorator;

/**
 * 资源加载蒙版.没打开之前(time s内)是不能点击其他地方的
 */
class LoadingPanel {
    //界面url  加载时间
    private _viewMapTime: Map<string, number> = new Map()
    public cfgTime = 50 //配置时间
    private _pageLoadingPanelNode: cc.Node = null
    public update(dt: number) {
        if (!this._viewMapTime.size) return
        let df = false
        for (let [key, time] of this._viewMapTime) {
            if (time > Date.now()) {
                df = true
                break
            }
        }
        this._pageLoadingPanelNode.active = df
    }
    constructor(parent: cc.Node) {
        this._pageLoadingPanelNode = new cc.Node("pageLoadingPanel")
        this._pageLoadingPanelNode.parent = parent
        this._pageLoadingPanelNode.zIndex = cc.macro.MAX_ZINDEX
        this._pageLoadingPanelNode.addComponent(cc.BlockInputEvents)
        this._pageLoadingPanelNode.setContentSize(cc.winSize)
        // const widget = this._pageLoadingPanelNode.addComponent(cc.Widget)
        // widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true
        // widget.left = 0, widget.right = 0, widget.top = 0, widget.bottom = 0
        // widget.updateAlignment()
        this._pageLoadingPanelNode.active = false
    }
    setStateEnabled(key: string, enable: boolean) {
        if (enable) {
            this._viewMapTime.set(key, Date.now() + this.cfgTime * 1000)//记录加载时间
        } else {
            this._viewMapTime.delete(key)
            this._pageLoadingPanelNode.active = this._viewMapTime.size != 0
        }
    }
}

@ccclass
@menu('自定义组件/ViewMgr')
@disallowMultiple
@$gb.Identifiable
export class ViewMgr extends BaseLogic {
    /**view 管理map */
    private _viewMap: Map<UiIdType, BaseView> = new Map();
    /**层级预处理  打开是异步的 */
    private _sNZIdxMap = new Map<UiIdType, number>()
    // /**资源加载遮罩层 */
    private _pageLoadingPanel: LoadingPanel = null
    /**以组的方式存储界面信息 */
    private _saveGroupMap = new Map<number, ccArrayType<UiIdType>>()
    /**多场景的存储 多用于通用弹窗*/
    private _mutliViewMap = new Map<UiIdType, ccArrayType<BaseView>>()

    /**资源加载蒙版层 */
    get pageLoadingPanel() {
        if (!this._pageLoadingPanel) {
            return this._pageLoadingPanel = new LoadingPanel(this.node)
        }
        return this._pageLoadingPanel
    }

    __preload() {
        $app.view = this
        $app.view.renderPixelCamare
    }

    /**
     * 创建 Dialog 遮罩层（点击关闭）
     * @param parentNode 父节点
     * @param script 目标 View 脚本
     */
    private async _createDialogMaskLayer(parentNode: cc.Node, script: BaseView) {
        const layerSf = await $app.load.getRes("singleColor", cc.SpriteFrame, this, ReleaseType.Forever)
        const layer = new cc.Node(dialogLayerName).addComponent(cc.Sprite)
        layer.sizeMode = cc.Sprite.SizeMode.CUSTOM
        layer.type = cc.Sprite.Type.SLICED
        layer.spriteFrame = layerSf
        layer.node.parent = parentNode
        layer.node.zIndex = cc.macro.MIN_ZINDEX
        layer.node.setContentSize(cc.winSize)
        layer.node.color = cc.Color.BLACK
        layer.node.opacity = 80
        $app.uiTool.addNodeBtnEvent({
            node: layer.node,
            targetNode: script.node,
            targetScript: script.className,
            clickFuncName: "close"
        })
    }

    /**获取最上层的viewInfo */
    getPopViewInfo() {
        let maxUid: UiIdType = null, idx = -0xff
        for (let [uid, zIndex] of this._sNZIdxMap) {
            if (zIndex > idx) {
                maxUid = uid
                idx = zIndex
            }
        }
        const viewInfo = getUiDefined(maxUid)
        return viewInfo
    }
    async open(uid: UiIdType, data: any = null, callBack: Function = null, ...args) {
        return await this.showView(uid, null, 0, data, callBack, ...args)
    }
    /**
     * 打开view
     * @param uid 
     * @param mid 
     * @param ctrlId 
     * @param group 组
     * @param callBack 回调
     * @param args 多余后续的参数 
     * @returns 
     */
    async openPage(uid: UiIdType, ctrlId: CtrlIdType = null, group: number = null, callBack: Function = null, ...args) {
        return await this.showView(uid, ctrlId, group, callBack, ...args)
    }
    async showView(uid: UiIdType, ctrlId: CtrlIdType = null, group: number = null, callBack: Function = null, ...args) {
        const viewInfo = getUiDefined(uid)
        const view = this._viewMap.get(uid)
        if (view) {
            // view.node.active = true
            view.init(uid, ctrlId || viewInfo.ctrId, ...args);
            callBack?.(view)
            return view
        }
        //提前处理加载的zindex问题
        let zIndex = viewInfo.zdx
        if (zIndex == 0) {
            this._findDefaultMaxZIndex(viewInfo.uid)
        }
        if (viewInfo.state == IViewState.LOADING) {
            clog.warn("ViewMgr: view 正在加载中,uid = " + uid)
            return
        }
        viewInfo.state = IViewState.LOADING
        this.pageLoadingPanel.setStateEnabled(viewInfo.path, true)
        const pathSplit = ccArray.from(viewInfo.path.split("/"))
        const bPath = "%s.%s".format(viewInfo.bundle, viewInfo.path)
        const liftNode = new cc.Node(pathSplit.lastOne + "_liftViewNode")//界面资源生命周期
        const resPrefab = await $app.load.getRes(bPath, cc.Prefab, liftNode, ReleaseType.DelayTwo)//
        if (resPrefab == null) {
            this.pageLoadingPanel.setStateEnabled(viewInfo.path, false)
            liftNode.destroy()
            viewInfo.state = IViewState.ERROR
            return
        }
        //再次确定zindex 
        zIndex = this._sNZIdxMap.get(viewInfo.uid)
        if (zIndex == undefined) {//异步的被提前关闭了
            if (viewInfo.zdx == 0) {//还是默认的需要设置层级
                clog.warn("异步的被提前关闭了 uid = " + uid)
                liftNode.destroy()
                viewInfo.state = IViewState.CLOSE
                return null
            }
            //这是不被管理的view zIndex 就直接设置
            zIndex = viewInfo.zdx
        }
        const cloneNode = cc.instantiate(resPrefab)
        const script = cloneNode.getComponent(resPrefab.name) as BaseView
        liftNode.parent = cloneNode
        if (viewInfo.isAutoCloseDialog && viewInfo.windowType === WindowType.Dialog) {
            await this._createDialogMaskLayer(cloneNode, script)
        }
        const bg = cloneNode.getChildByName("bg")
        viewInfo.isAddBgBlock && bg?.getComponentOrAdd(cc.BlockInputEvents)
        if (!script) {
            clog.error(`ViewMgr: can not find script in view,${cloneNode.name}的名字必须和脚本的名字相同!~`)
            cloneNode.destroy()
            viewInfo.state = IViewState.ERROR
            return null
        }

        if (group) {//加入组中
            let viewAry = this._saveGroupMap.get(group)
            if (!viewAry) {
                viewAry = ccArray<UiIdType>()
                this._saveGroupMap.set(group, viewAry)
            }
            viewAry.pushCheck(uid)
        }

        viewInfo.state = IViewState.SHOW
        cloneNode.position = cc.Vec3.ZERO
        cloneNode.parent = this.getViewParentNode()
        cloneNode.zIndex = zIndex
        this._viewMap.set(uid, script)
        script.init(uid, ctrlId || viewInfo.ctrId, ...args)
        callBack?.(script)
        this._doViewZdx()
        const tScript = script as BaseView & { start?: () => void }
        const startFunc = tScript.start
        tScript.start = () => {
            clog.view("%s 界面 start函数触发".format(script.className))
            this.pageLoadingPanel.setStateEnabled(viewInfo.path, false)//完全打开了
            $app.dispatch.emit(GameEvents.VIEW_START, uid, script)
            startFunc.call(script)
        }
        $app.dispatch.emit(GameEvents.VIEW_OPEN, uid, script)
        clog.space();
        return script
    }
    /**
     * 多view的打开 目前只处理了propView
     * @param uid 
     * @param ctrlId 
     * @param group 
     * @param data 
     * @param callBack 
     * @param args 
     * @returns 
     */
    async openMutliView(uid: UiIdType, ctrlId: CtrlIdType = null, group: number = null, data: any = null, callBack: Function = null, ...args) {
        const viewInfo = getUiDefined(uid)
        const baseViews = this._mutliViewMap.get(uid) ?? ccArray<BaseView>()
        this._mutliViewMap.set(uid, baseViews)
        //提前处理加载的zindex问题
        let zIndex = viewInfo.zdx
        if (zIndex == 0) {
            this._findDefaultMaxZIndex(viewInfo.uid)
        }
        this.pageLoadingPanel.setStateEnabled(viewInfo.path, true)
        const pathSplit = viewInfo.path.split("/")
        const bPath = "%s.%s".format(viewInfo.bundle, viewInfo.path)
        const liftNode = new cc.Node(pathSplit[pathSplit.length - 1] + "_liftViewNode")//界面资源生命周期
        const resPrefab = await $app.load.getRes(bPath, cc.Prefab, liftNode, ReleaseType.AtOnce)//
        //确定zindex 
        zIndex = baseViews.length != 0 ? (baseViews[baseViews.length - 1].node.zIndex + 5) : this._sNZIdxMap.get(viewInfo.uid)
        const cloneNode = cc.instantiate(resPrefab)
        const script = cloneNode.getComponent(resPrefab.name) as BaseView
        liftNode.parent = cloneNode
        if (viewInfo.isAutoCloseDialog && viewInfo.windowType === WindowType.Dialog) {
            await this._createDialogMaskLayer(cloneNode, script)
        }
        const bg = cloneNode.getChildByName("bg")
        bg?.getComponentOrAdd(cc.BlockInputEvents)
        if (!script) {
            clog.error("ViewMgr: can not find script in view,view的名字必须和脚本的名字相同!~")
            return null
        }
        if (group) {//加入组中
            let viewAry = this._saveGroupMap.get(group)
            if (!viewAry) {
                viewAry = ccArray<UiIdType>()
                this._saveGroupMap.set(group, viewAry)
            }
            viewAry.pushCheck(uid)
        }
        cloneNode.position = cc.Vec3.ZERO
        cloneNode.parent = this.getViewParentNode()
        cloneNode.zIndex = zIndex
        baseViews.push(script)
        script.init(uid, ctrlId || viewInfo.ctrId, data, ...args)
        callBack?.(script)
        this._doMutliViewZdx()
        //hook start函数
        const hackScript = script as unknown as { start: Function, className: string }
        const start = hackScript.start
        hackScript.start = () => {
            clog.view("%s start函数触发".format(hackScript.className))
            this.pageLoadingPanel.setStateEnabled(viewInfo.path, false)//完全打开了
            start.call(script)
        }
        $app.dispatch.emit(GameEvents.VIEW_OPEN, uid, script)
        return script
    }
    protected update(dt: number) {
        this.pageLoadingPanel?.update?.(dt)
    }
    /**
     * 找到当前最大的默认层级
     * 主要做界面打开关闭等瞬间管理
     * @param uid 
     */
    private _findDefaultMaxZIndex(uid: UiIdType) {
        let maxZIndex = 0
        for (let [name, zIndex] of this._sNZIdxMap) {
            maxZIndex = Math.max(maxZIndex, zIndex)
            clog.log("已存在 view:" + name, "zIndex:" + zIndex)
        }
        maxZIndex += UiZdxType.ViewOffZdx
        this._sNZIdxMap.set(uid, maxZIndex)
        clog.view("当前view " + " id = " + uid, "zIndex = " + maxZIndex)
    }
    /**
     * 处理层级
     */
    private _doViewZdx() {
        const vs: { [i in number]: UiIdType } = {}
        //排序
        this._sNZIdxMap.forEach((zIdx: number, key: UiIdType) => {
            vs[zIdx] = key
        })
        //界面打开排序
        const zAry = Object.keys(vs)
        let topIsFull = false, fullzIdx = -0xff, isAct = true, topDialogIdx = -1
        for (let i = zAry.length - 1; i >= 0; i--) {
            const zIdx = zAry[i]
            const uid = vs[zIdx] as UiIdType
            const viewInfo = getUiDefined(uid)
            if (i == zAry.length - 1) {
                topIsFull = viewInfo.windowType == WindowType.Full
            }
            const view = this._viewMap.get(uid)
            if (topIsFull) {//顶层是全屏的就不管他的层级了
                view.node.active = i == zAry.length - 1
            } else {
                fullzIdx = viewInfo.windowType == WindowType.Full ? i : fullzIdx
                if (viewInfo.windowType == WindowType.Dialog) {
                    if (topDialogIdx == -1) {
                        topDialogIdx = i // 记录最上层的 dialog 索引
                    }
                    const layer = view.node.getChildByName(dialogLayerName)
                    if (layer) {
                        layer.active = i == topDialogIdx // 只有最上层的 dialog 的 蒙版 节点才显示
                    }
                }
                view.node.active = isAct
                if (fullzIdx == i) {//最上的一层全屏找到了 剩下的全部隐藏
                    isAct = false
                }
            }
        }
    }
    /**
    * 处理mutli view层级
    * 目前只针对 propView  
    */
    private _doMutliViewZdx() {
        //以下代码由AI生成
        const allViews: BaseView[] = [];
        // 收集所有多视图
        this._mutliViewMap.forEach(views => {
            allViews.push(...views);
        });
        // 按 zIndex 排序
        allViews.sort((a, b) => a.node.zIndex - b.node.zIndex);
        // 更新层级显示
        let topFullScreenIndex = -1;
        for (let i = allViews.length - 1; i >= 0; i--) {
            const view = allViews[i];
            const viewInfo = getUiDefined(view.id);
            // 更新全屏界面标记
            if (viewInfo.windowType === WindowType.Full) {
                topFullScreenIndex = i;
            }
            // 更新对话框背景
            if (viewInfo.windowType === WindowType.Dialog) {
                const layer = view.node.getChildByName(dialogLayerName);
                if (layer) {
                    // 只有最顶层的对话框显示背景
                    layer.active = (i === allViews.length - 1);
                }
            }
            // 隐藏被全屏界面覆盖的视图
            view.node.active = (i > topFullScreenIndex);
        }
    }
    /**
     * 以组的方式关闭views
     * @param group 
     * @returns 
     */
    closeGroupViews(group: number) {
        const viewAry = this._saveGroupMap.get(group)
        if (!viewAry) return
        clog.view("关闭组view:", group)
        for (let a = viewAry.length - 1; a >= 0; a--) {
            const uid = viewAry[a]
            const view = this.getView(uid, BaseView)
            view.close()
        }
        viewAry.length = 0
        this._saveGroupMap.delete(group)
    }
    /**
     * 获取view
     * @param id 
     * @param classType 
     * @returns 
     */
    getView(id: UiIdType): cc.Node
    getView<T extends BaseView>(id: UiIdType, classType: { prototype: T }): T
    getView<T extends BaseView>(id: UiIdType, classType?: { prototype: T }) {
        var node = this._viewMap.get(id)?.node
        if (classType) {
            return node?.getComponent(classType) as T
        }
        return node
    }
    /**
     * close
     * @param uid 
     * @returns 
     */
    close(uid: UiIdType) {
        if (!uid) return
        const viewInfo = getUiDefined(uid)
        const view = this._viewMap.get(uid)
        this._sNZIdxMap.delete(uid)
        for (let [group, viewAry] of this._saveGroupMap) {
            const index = viewAry?.indexOf(uid)
            if (index > -1) {
                viewAry.splice(index, 1)
            }
        }
        this.pageLoadingPanel.setStateEnabled(viewInfo.path, false)
        this._doViewZdx()
        viewInfo.state = IViewState.CLOSE
        if (!cc.isValid(view)) return
        view.node.removeFromParent(true)
        view.node.destroy()
        view.getCtrl()?.deleteViewId(uid)
        this._viewMap.delete(uid)
        $app.dispatch.emit(GameEvents.VIEW_CLOSE, uid)
    }
    /**多view的关闭 */
    mutilClose(uid: UiIdType) {
        const views = this._mutliViewMap.get(uid) || []
        const view = views.pop() // 弹出最上层的多例 View 实例
        if (!cc.isValid(view)) return
        // 执行标准的清理和销毁
        view.node.removeFromParent(true)
        view.node.destroy()
        view.getCtrl()?.deleteViewId(uid)
        // 如果该 uid 的所有实例都关闭了，清理多例 View Map
        if (views.length === 0) {
            this._mutliViewMap.delete(uid)
            // 还需要清理组信息，如果它在组中
            for (let [group, viewAry] of this._saveGroupMap) {
                const index = viewAry?.indexOf(uid)
                if (index > -1) {
                    viewAry.splice(index, 1) // 从组中删除该 ID
                }
            }
        }
        // 重新排序多例层级
        this._doMutliViewZdx()
        $app.dispatch.emit(GameEvents.VIEW_CLOSE, uid)
    }

    private getViewParentNode(zIndex: number = 0) {
        const node = this._getWidgetNode(viewNodeParentName)
        node.zIndex = zIndex
        return node
    }
    private getToastParentNode(zIndex: number = 2) {
        const node = this._getWidgetNode(viewToastParentName)
        node.zIndex = zIndex
        return node
    }
    private _getWidgetNode(name: string) {
        let node = this.node.getChildByName(name)
        if (!node) {
            node = new cc.Node(name)
            node.setContentSize(cc.winSize)
            // const widget = node.addComponent(cc.Widget)
            // widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true
            // widget.left = 0, widget.right = 0, widget.top = 0, widget.bottom = 0
            // widget.updateAlignment()
            node.parent = this.node
        }
        return node
    }
    //////////////////////////////////////////////////
    /**
     * 展示提示
     * @param msg 
     * @param duration 
     */
    async showToast(msg: string, duration: number = 2) {
        const parent = this.getToastParentNode()
        let toast = $app.pool.use("showToast", this)
        if (!toast) {
            const prefab = await $app.load.getRes(toastPrefabPath, cc.Prefab, this, ReleaseType.Forever)
            toast = cc.instantiate(prefab)
            toast.name = "showToast"
        }
        toast.active = true
        toast.parent = parent
        // cc.tween(toast)
    }

    /**
     * 展示弹窗
     * 默认midBtnStr 模式
     * @param param 
     */
    showPrompt(param: PromptBoxType, group: number = 0) {
        param.title = param.title || "提示"
        param.msg = param.msg
        param.midBtnStr = param.midBtnStr || "确定"
        param.leftBtnStr = param.leftBtnStr
        param.rightBtnStr = param.rightBtnStr
        param.leftCallback = param.leftCallback || null
        param.rightCallback = param.rightCallback || null
        param.midCallback = param.midCallback || null
        param.isNew = param.isNew || false
        //
        this[param.isNew ? "openMutliView" : "showView"](UiId.PromptBoxView, null, group, param)
    }

    private _renderPixelCamare: cc.Camera = null
    private _renderPixelTexture: cc.RenderTexture = null
    /**读取像素渲染的纹理 */
    get renderPixelTexture() {
        if (!this._renderPixelTexture) {
            this._renderPixelTexture = new cc.RenderTexture()
            this._renderPixelTexture.initWithSize(cc.visibleRect.width, cc.visibleRect.height)
        }
        return this._renderPixelTexture
    }
    /**读取像素渲染的相机 */
    get renderPixelCamare() {
        if (!this._renderPixelCamare) {
            const node = this._getWidgetNode("$renderPixelCamare$")
            node.zIndex = cc.macro.MAX_ZINDEX
            this._renderPixelCamare = node.getComponentOrAdd(cc.Camera)
            this._renderPixelCamare.node.parent = this.node
            this._renderPixelCamare.depth = 1
            this._renderPixelCamare.backgroundColor = new cc.Color(0, 0, 0, 0)
            this._renderPixelCamare.clearFlags = cc.Camera.ClearFlags.COLOR |
                cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL
            this._renderPixelCamare.rect = cc.rect(0, 0, 1, 1)
            this._renderPixelCamare.zoomRatio = 1
            this._renderPixelCamare.alignWithScreen = true
            this._renderPixelCamare.cullingMask = 0
            cc.game.config.groupList.forEach((_, index) => {
                this._renderPixelCamare.cullingMask |= 1 << index
            })
            //
            this._renderPixelCamare.targetTexture = this.renderPixelTexture
            $app.uiTool.nextFrame(() => {
                this._renderPixelCamare.render()
                this._renderPixelCamare.enabled = false
            })
            // const sp = new cc.Node().addComponent(cc.Sprite)
            // sp.spriteFrame = new cc.SpriteFrame(this.renderPixelTexture)
            // sp.node.parent = this.node
            // sp.node.scaleY = -1 * sp.node.scaleY
        }
        return this._renderPixelCamare
    }

}

export interface PromptBoxType {
    title?: string, msg: string,
    /**是否new一个新的弹窗,如果是,会实例化个新的窗口出来弹窗 */
    isNew?: boolean,
    midBtnStr?: string,
    leftBtnStr?: string,
    rightBtnStr?: string,
    leftCallback?: Function,
    rightCallback?: Function,
    midCallback?: Function,
}