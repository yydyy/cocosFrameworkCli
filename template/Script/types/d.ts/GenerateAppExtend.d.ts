/*
 * @Author: auto-generated
 * @Date: 2026-03-17
 * @Description: IAppExtend 接口扩展类型声明
 * 
 * 此文件由工具自动生成，请勿手动修改
 * 运行 npm run generate-app-extend 自动更新
 */

import type { HttpMgr } from "../../Extend/mgr/HttpMgr"
import type { LoadMgr } from "../../Extend/mgr/LoadMgr"
import type { netMgr } from "../../Extend/mgr/NetMgr"
import type { testMgr } from "../../Test/Generate"

declare module "../../Extend/mgr/AppExtend" {
    interface IAppExtend {
        http: InstanceType<typeof HttpMgr>
        load: InstanceType<typeof LoadMgr>
        net: InstanceType<typeof netMgr>
        TestMgr: InstanceType<typeof testMgr>
    }
}
