// @FilePath: Events.ts

/*
 * @Author: yyd
 * @Date: 2025-07-13 14:56:04
 * @LastEditTime: 2026-03-07 10:02:03
 * @FilePath: \cocosTools\assets\Script\Extend\Base\Events.ts
 * @Description:  派发 id 与回调类型声明
 */

import type { BaseView } from "./BaseView";

const _GameEvents = {
    /**view close 事件 */
    VIEW_CLOSE: "VIEW_CLOSE",
    /**view open 事件 */
    VIEW_OPEN: "VIEW_OPEN",
    /**view start 事件 */
    VIEW_START: "VIEW_START",
    /**游戏后台切回来事件 */
    GAME_SHOW: "GAME_SHOW",
    /**游戏切后台事件 */
    GAME_HIDE: "GAME_HIDE",
} as const

/**
 * 分包事件回调类型扩展接口
 */
export interface ICustomEventsExtend { }

export const GameEvents = _GameEvents as typeof _GameEvents & ICustomEventsExtend
require("../../types/GenerateEventsExtend")

if (CC_DEV) window["GameEvents"] = GameEvents

/** 为主包事件 ID 关联具体参数类型 */
export interface ICustomEvents {
    [GameEvents.VIEW_OPEN]: (id: UiIdType, script: BaseView) => void;
    [GameEvents.VIEW_CLOSE]: (id: UiIdType) => void;
    [GameEvents.VIEW_START]: (id: UiIdType, script: BaseView) => void;
    [GameEvents.GAME_SHOW]: () => void;
    [GameEvents.GAME_HIDE]: () => void;
};

export type EventType = keyof ICustomEvents;
export type CustomEvents = ICustomEvents;

