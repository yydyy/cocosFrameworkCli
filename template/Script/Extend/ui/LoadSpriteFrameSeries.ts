// @FilePath: LoadSpriteFrameSeries.ts
/*
 * @Author: yyd
 * @Date: 2024-04-11 10:09:39
 * @LastEditTime: 2025-08-06 21:30:56
 * @FilePath: \cocostools\cocosTools\assets\Script\Extend\ui\LoadSpriteFrameSeries.ts
 * @Description:  loadMgr setSpriteFrame 设置时序问题
 */

const { ccclass, property } = cc._decorator;

export class LoadSpriteFrameClass {
    /**时序key */
    private _LoadSpriteFrameToken: number = 0
    /**
     * 叠加token
     * @param key 
     */
    add() {
        this._LoadSpriteFrameToken++
        return this._LoadSpriteFrameToken
    }
    /**
     * 是否是最新的序列
     * @param key 
     * @returns 
     */
    isLast(key: number) {
        return this._LoadSpriteFrameToken === key
    }
}

@ccclass
export default class LoadSpriteFrameSeries extends cc.Component {
    private _LoadSpriteFrameClass: LoadSpriteFrameClass = new LoadSpriteFrameClass()
    /**
    * 叠加token
    * @param key 
    */
    add() {
        return this._LoadSpriteFrameClass.add()
    }

    /**
     * 是否是最新的序列
     * @param key 
     * @returns 
     */
    isLast(key: number) {
        return this._LoadSpriteFrameClass.isLast(key)
    }
}
