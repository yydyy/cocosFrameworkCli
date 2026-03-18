// @FilePath: Ctrl.ts
/*
 * @Author: yyd
 * @Date: 2024-07-06 20:38:08
 * @LastEditTime: 2026-03-07 16:07:25
 * @FilePath: \cocosTools\assets\Script\Extend\Base\Ectrl.ts
 * @Description:  控制器 ctrlId
 */

const _CtrlId = {

} as const

/** 扩展控制器id类型（模块通过 declare module 扩展此接口）*/
export interface ICtrlIdExtend { }
/** CtrlId 到 Ctrl 类型的映射（通过 declare module 扩展）*/
export interface ICtrlTypeMap {
    // 基础映射，子模块扩展
}

type ICtrlIdType = typeof _CtrlId & ICtrlIdExtend

export const CtrlId = _CtrlId as ICtrlIdType
if (CC_DEV) window["CtrlId"] = CtrlId
// import("../../types/GenerateCtrlIdExtend")
require("../../types/GenerateCtrlIdExtend")