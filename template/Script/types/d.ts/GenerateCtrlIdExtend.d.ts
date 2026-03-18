/*
 * @Author: auto-generated
 * @Date: 2026-03-17
 * @LastEditTime: 2026-03-17 01:15:49
 * @FilePath: \cocosTools\assets\Script\types\GenerateCtrlIdExtend.d.ts
 * @Description: 控制器类型映射，工具自动生成
 */


import type { BattleCtrl } from "../../Test/BattleCtrl"
import type { TestCtrl } from "../../Test/TestCtrl"

declare module "../../Extend/Base/Ectrl" {
    interface ICtrlIdExtend {
        BattleCtrl: "BattleCtrl";
        TestCtrl: "TestCtrl";
    }

    interface ICtrlTypeMap {
        BattleCtrl: BattleCtrl
        TestCtrl: TestCtrl
    }
}
