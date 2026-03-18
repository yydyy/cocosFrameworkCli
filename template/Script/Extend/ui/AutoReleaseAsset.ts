// @FilePath: AutoReleaseAsset.ts
/*
 * @Author: yyd
 * @Date: 2024-04-08 19:06:55
 * @LastEditTime: 2025-03-13 14:58:50
 * @FilePath: \cocosTools\assets\Script\Extend\ui\AutoReleaseAsset.ts
 * @Description:  自动asset资源 单独处理
 * 
 */

import { ReleaseType } from "../mgr/ReleaseType"

const { ccclass, disallowMultiple } = cc._decorator

@ccclass
@disallowMultiple
export class AutoReleaseAsset extends cc.Component {
    addReleaseAsset(path: string, asset: cc.Asset, relaseType: ReleaseType) {
        $app.load.addReleaseAsset(path, asset, relaseType, this.node)
    }

    protected onDestroy(): void {
        //处理标记   看需求是否马上释放
        $app.load.checkAtOnceReleaseAssets(this)
    }
}