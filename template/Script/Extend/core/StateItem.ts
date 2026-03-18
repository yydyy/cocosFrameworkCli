// @FilePath: StateItem.ts
/*
 * @Author: yyd
 * @Date: 2024-07-09 13:32:18
 * @LastEditTime: 2025-08-15 22:51:37
 * @FilePath: \cocosTools\assets\Script\Extend\StateItem.ts
 * @Description:  多状态
 */


export class StateItem {
    protected _state: number = 0;
    get state() {
        return this._state
    }
    /**
     * 是否包含状态
     * @param state 
     * @returns boolen ture包含  false不包含
     */
    isStateEnable(state: number) {
        return (this._state & state) != 0
    }
    /**
     * 设置状态
     * @param state 状态
     * @param enable true是添加对应状态 false是取消对应状态
     */
    setState(state: number, enable: boolean) {
        if (enable) {
            this._state |= state
        } else {
            this._state &= ~state
        }
    }
    /**
     * 重置状态
     */
    reset(state: number = 0) {
        this._state = state
    }
}