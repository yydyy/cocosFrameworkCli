// @FilePath: UiDefines.ts
/*
 * @Author: yyd
 * @Date: 2024-07-06 20:15:11
 * @LastEditTime: 2026-03-14 20:17:15
 * @FilePath: \cocosTools\assets\Script\Extend\Base\UiDefines.ts
 * @Description:  定义UI的id和路径
 */

import type { Bundles } from "./Bundles";

/**层级定义 */
export enum UiZdxType {
    default = 0,//默认起始层 一般就是普通界面的设置
    Sys = 10000,//系统层  一般是跑马灯之类的

    /**view之间的间距 */
    ViewOffZdx = 20
}

/**窗口类型 */
export enum WindowType {
    Dialog = "Dialog",//弹窗
    Full = "Full",//全屏
}

export enum IViewState {
    ERROR,
    LOADING,
    SHOW,
    CLOSE,
}

/**界面数据类型 */
export interface IViewDefined {
    readonly uid: keyof typeof UiId
    readonly ctrId?: CtrlIdType
    readonly path: string                              //相对bundle的相对目录
    readonly bundle: keyof typeof Bundles
    readonly windowType: WindowType
    zdx: UiZdxType
    readonly isAutoCloseDialog?: boolean  //如果dialog类型,是否点击空白关闭dialog
    readonly isAddBgBlock?: boolean//view 下如果有bg 是否自动添加一个BlockInputEvents遮罩层
    state?: IViewState
}

/** 扩展界面id类型（模块通过 declare module 扩展此接口）*/
export interface IUiIdExtend { }

/** 基础界面id（只写一次值，类型自动推导）*/
const _UiIdBase = {
} as const;

/** UiId 完整类型 = 基础（自动推导） + 扩展 */
type IUiIdType = typeof _UiIdBase & IUiIdExtend;

/**界面id（运行时对象，类型会随 IUiIdExtend 扩展自动更新）*/
export const UiId = _UiIdBase as IUiIdType;

if (CC_DEV) window["UiId"] = UiId

/**dialog 单独的遮罩node的名字 */
export const dialogLayerName = "$singleMaskLayer$"
/**view父节点的名字 */
export const viewNodeParentName = "$viewNodeParent$"
/**提示父节点的名字 */
export const viewToastParentName = "$viewToastParent$"
/**跑马灯 path */
export const toastPrefabPath = "common.view/toast"

// 内部使用的uiDefined，不直接导出
const _uiDefined = new Map<UiIdType, IViewDefined>();
if (CC_DEV) window["uiDefined"] = _uiDefined

/**
 * 获取uiDefined实例（仅内部使用）
 */
export function getUiDefined(id: UiIdType) {
    return _uiDefined.get(id);
}

/**
 * 注册界面信息（仅内部使用）
 */
export function registerViewInfo(uid: UiIdType, viewInfo: IViewDefined) {
    _uiDefined.set(uid, viewInfo);
}

require("../../types/GenerateViewExtend")
