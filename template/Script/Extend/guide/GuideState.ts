// @FilePath: GuideState.ts
/*
 * @Author: yyd
 * @Description: 引导步骤基类（基于通用状态机）
 */

import { State, IState } from "../fsm/State";

export type GuideCondition = () => boolean | Promise<boolean>;

export interface IGuideFSM {
    readonly context: GuideContext;
    next(): Promise<void>;
    goTo(stepId: string | number): Promise<void>;
    changeState(stateId: string | number): void;
    getCurrentState(): IState<GuideContext> | null;
}

export interface GuideContext {
    [key: string]: any;
}

/**
 * 引导步骤基类
 * 继承自通用 State，添加引导特有的功能
 */
export abstract class GuideState extends State<GuideContext> {
    /** 是否已完成 */
    private _completed = false;
    /** 等待resolve */
    private _waitResolve: (() => void) | null = null;

    get completed() { return this._completed; }

    /** 获取引导状态机（类型更精确） */
    get guideFSM(): IGuideFSM {
        return this.fsm as unknown as IGuideFSM;
    }

    /**
     * 检查是否可以跳过此步骤
     * 默认返回 false，子类可重写
     */
    canSkip(): boolean | Promise<boolean> {
        return false;
    }

    /**
     * 标记步骤完成，自动切换到下一步
     */
    protected complete() {
        if (this._completed) return;
        this._completed = true;
        this._resolveWait();
        this.guideFSM?.next();
    }

    /**
     * 等待某个条件满足
     * @param condition 条件函数
     * @param interval 检查间隔(ms)
     */
    protected waitUntil(condition: GuideCondition, interval = 100): Promise<void> {
        return new Promise((resolve) => {
            const check = async () => {
                if (await condition()) {
                    resolve();
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    }

    /**
     * 等待指定时间
     */
    protected wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 等待外部调用 resume()
     */
    protected waitForResume(): Promise<void> {
        return new Promise(resolve => {
            this._waitResolve = resolve;
        });
    }

    /**
     * 恢复等待（外部调用）
     */
    resume() {
        this._resolveWait();
    }

    private _resolveWait() {
        if (this._waitResolve) {
            this._waitResolve();
            this._waitResolve = null;
        }
    }

    /**
     * 重置状态（用于重新开始）
     */
    reset() {
        this._completed = false;
        this._waitResolve = null;
    }
}
