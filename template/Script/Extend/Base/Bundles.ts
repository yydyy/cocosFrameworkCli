// @FilePath: Bundles.ts
/*
 * @Author: yyd
 * @Date: 2026-03-04
 * @Description:  Bundle 名字定义与扩展
 */

const _BundlesBase = {
    common: "common",
} as const;

/** 扩展 Bundle 名字类型（通过 declare module 扩展此接口）*/
export interface IBundleIdExtend { }

/** Bundle 名字完整类型 = 基础（自动推导） + 扩展 */
type BundlesType = typeof _BundlesBase & IBundleIdExtend;

/** BundleId 类型，只包含基础 + 扩展声明的 key */
export type BundleIdType = keyof BundlesType;

/** 运行时 Bundle 映射对象（类型会随 IBundleIdExtend 扩展自动更新）*/
export const Bundles = _BundlesBase as BundlesType;

if (CC_DEV) window["Bundles"] = Bundles;


/**
 * 动态注册 Bundle 名字（运行时 + 类型扩展通过插件自动生成）
 * 只要在任意 ts 文件中调用 registerBundle("xxx")，
 * 插件就会根据调用生成 IBundleIdExtend 的声明扩展。
 */
export function registerBundle(id: string) {
    const bundles = Bundles as any;
    bundles[id] = id;
}

