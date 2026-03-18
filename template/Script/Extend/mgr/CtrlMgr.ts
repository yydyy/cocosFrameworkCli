// @FilePath: CtrlMgr.ts
/*
 * @Author: yyd
 * @Date: 2024-08-03 16:39:30
 * @LastEditTime: 2026-02-28 22:56:13
 * @FilePath: \cocosTools\assets\Script\Extend\mgr\CtrlMgr.ts
 * @Description:  ctrl管理器
 */

import BaseCtrl from "../Base/BaseCtrl";
import type { ICtrlTypeMap } from "../Base/Ectrl";

@$gb.Identifiable
class CtrlMgr_ {
    private _ctrlMap = new Map<CtrlIdType, BaseCtrl>()

    /**
     * 清空所有ctrl
     */
    clear() {
        for (let [key, ctrl] of this._ctrlMap) {
            ctrl.onDestroy()
        }
        this._ctrlMap.clear()
    }
    /**
     * 移除ctrl
     * @param target 
     */
    removeCtrl(target: BaseCtrl)
    removeCtrl(target: CtrlIdType)
    removeCtrl(target: BaseCtrl | CtrlIdType) {
        if (!target) return
        if (target instanceof Object) {
            clog.log("移除控制器" + target.id)
            target.onDestroy()
            this._ctrlMap.delete(target.id as any)
            return
        }
        clog.log("移除控制器", target)
        let ctrl = this._ctrlMap.get(target)
        ctrl.onDestroy()
        this._ctrlMap.delete(target)
    }

    /**
     * 获取ctrl 
     * @param target 
     */
    getCtrl<K extends keyof ICtrlTypeMap>(target: K): ICtrlTypeMap[K]
    getCtrl<T extends BaseCtrl = BaseCtrl>(target: ConstructorTemplateType<T>): T
    getCtrl(target: CtrlIdType | ConstructorTemplateType<any>) {
        if (target instanceof Object) {
            for (let [key, ctrl] of this._ctrlMap) {
                if (ctrl instanceof <any>target) {
                    return ctrl
                }
            }
        } else {
            const ctrl = this._ctrlMap.get(target)
            if (ctrl) {
                return ctrl;
            }
            return null
        }
    }
    /**
    * 获取ctrl 没有就创建
    * @param uid 
    * @param target? 控制器类
    * @param args 构造参数
    * @returns 
    */
    getCtrlOrAdd<K extends keyof ICtrlTypeMap>(uid: K, target?: ConstructorTemplateType<ICtrlTypeMap[K]>, ...args: any[]): ICtrlTypeMap[K]
    getCtrlOrAdd<T extends BaseCtrl = BaseCtrl>(uid: CtrlIdType, target?: ConstructorTemplateType<T>, ...args: any[]): T
    getCtrlOrAdd(uid: CtrlIdType, target?: ConstructorTemplateType<any>, ...args: any[]) {
        let ctrl: BaseCtrl = null
        if (!this._ctrlMap.has(uid)) {
            if (!target) {
                target = gRegisterClass.getClassById(uid) as ConstructorTemplateType<any>
                if (!target) {
                    clog.error(`获取控制器失败，没有找到控制器类: ${uid},bundle可能还未下载下来！`)
                    return null
                }
            }
            ctrl = new target(uid, ...args)
            this._ctrlMap.set(uid, ctrl)
        } else
            ctrl = this._ctrlMap.get(uid)
        return ctrl
    }
}

export const CtrlMgr = $gb.SingleFunc(CtrlMgr_) 