// @FilePath: BaseCtrl.ts
/*
 * @Author: yyd
 * @Date: 2024-04-13 20:42:48
 * @LastEditTime: 2026-01-02 22:01:55
 * @FilePath: \cocosTools\assets\Script\Extend\Base\BaseCtrl.ts
 * @Description:  基础ctrl模块
 */

import { BaseTemplate } from "./BaseTemplate";
import { BaseView } from "./BaseView";
import { CtrlId } from "./Ectrl";

// @ccclass
export default class BaseCtrl extends BaseTemplate {
    private _viewIds: ccArrayType<UiIdType> = null

    constructor(id: BaseType, ...args: any[]) {
        super(id, ...args)
        this._viewIds = ccArray<UiIdType>()
    }
    /**
     * 获取ctrl下的view
     * @param viewId 
     * @param target 
     * @returns 
     */
    getView(viewId: UiIdType): cc.Node
    getView<T extends BaseView>(viewId: UiIdType, target: { prototype: T }): T
    getView<T extends BaseView>(viewId: UiIdType, target?: { prototype: T }) {
        if (!viewId) {
            clog.warn("BaseCtrl.getView: 传入的viewId为空");
            return null;
        }
        if (!this._viewIds.includes(viewId)) {
            clog.warn(`BaseCtrl.getView: 视图ID ${viewId} 不在当前控制器管理范围内`);
            return null;
        }
        try {
            return $app.view.getView(viewId, target);
        } catch (error) {
            clog.error(`BaseCtrl.getView: 获取视图 ${viewId} 时发生错误`, error);
            return null;
        }
    }
    /**
     * 压入ctrl中
     * @param id 
     */
    pushViewId(id: UiIdType) {
        this._viewIds.pushCheck(id)
    }
    /**
     * 从ctrl中移除
     * @param id 
     */
    deleteViewId(id: UiIdType) {
        if (!id) {
            clog.warn("BaseCtrl.deleteViewId: 传入的id为空");
            return false;
        }
        const index = this._viewIds.indexOf(id);
        if (index !== -1) {
            this._viewIds.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * 获取views中的压入长度
     * @returns 
     */
    get viewCount() {
        return this._viewIds.length
    }
    /** 关闭本控制器下所有界面 */
    closeAllView() {
        const viewIdsCopy = [...this._viewIds];
        for (let i = viewIdsCopy.length - 1; i >= 0; i--) {
            const viewId = viewIdsCopy[i];
            try {
                $app.view.close(viewId);
            } catch (error) {
                clog.error(`BaseCtrl.closeAllView: 关闭视图 ${viewId} 时发生错误`, error);
            }
        }
        // 清空视图ID数组
        this._viewIds.length = 0;
    }

    /**
    * 单纯清除数据
    */
    onClearData() { }

    onDestroy() {
        clog.model("控制模块 onDestroy ", CtrlId[this.id])
        this.onClearData()
        this._viewIds.length = 0;
        super.onDestroy()
    }
}