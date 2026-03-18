/*
 * @Author: auto-generated
 * @Date: 2026-03-17
 * @LastEditTime: 2026-03-17 05:27:37
 * @FilePath: \\cocosTools\\assets\\Script\\types\\d.ts\\GenerateEventExtend.d.ts
 * @Description: 事件回调类型扩展，工具自动生成
 */

import type { GameEvents } from "../../Extend/Base/Events";

declare module "../../Extend/Base/Events" {
    interface ICustomEventsExtend {
        "CUSTOM_EVENT": "CUSTOM_EVENT";
        "MY_TEST": "MY_TEST";
        "OPP": "OPP";
    }
}

declare module "../../Extend/Base/Events" {
    interface ICustomEvents {
        [GameEvents.CUSTOM_EVENT]: (data: string) => void;
        [GameEvents.MY_TEST]: (data: number, name: string) => boolean;
        [GameEvents.OPP]: (data: symbol) => void;
    }
}
