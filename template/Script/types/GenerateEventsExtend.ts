/*
 * @Author: auto-generated
 * @Date: 2026-03-17
 * @LastEditTime: 2026-03-17 05:27:37
 * @FilePath: \cocosTools\assets\Script\types\GenerateEventsExtend.ts
 * @Description: 事件名字映射，工具自动生成
 */


import { GameEvents } from "../Extend/Base/Events";

const eventIds = ["CUSTOM_EVENT", "MY_TEST", "OPP"];

// 注册GameEvents
for (const eventId of eventIds) {
    GameEvents[eventId] = eventId;
}
