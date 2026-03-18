// @FilePath: Transition.ts
/*
 * @Author: yyd
 * @Description: 状态转换规则
 */

import { IState } from "./State";

export interface ITransition<TContext = any> {
    /** 来源状态（* 表示任意状态） */
    from: string | number | '*';
    /** 目标状态 */
    to: string | number;
    /** 转换条件 */
    condition?: (context: TContext, currentState: IState<TContext>) => boolean;
    /** 优先级（数值越大优先级越高） */
    priority?: number;
}

/**
 * 转换表管理器
 * 用于管理状态间的转换规则
 */
export class TransitionTable<TContext = any> {
    private _transitions: ITransition<TContext>[] = [];

    /**
     * 添加转换规则
     */
    add(transition: ITransition<TContext>): this {
        this._transitions.push({
            ...transition,
            priority: transition.priority ?? 0
        });
        this._transitions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        return this;
    }

    /**
     * 批量添加
     */
    addMany(transitions: ITransition<TContext>[]): this {
        transitions.forEach(t => this.add(t));
        return this;
    }

    /**
     * 移除转换规则
     */
    remove(from: string | number | '*', to: string | number): boolean {
        const index = this._transitions.findIndex(t => t.from === from && t.to === to);
        if (index !== -1) {
            this._transitions.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 清空所有规则
     */
    clear() {
        this._transitions = [];
    }

    /**
     * 评估并获取下一个可转换的状态
     */
    evaluate(context: TContext, currentState: IState<TContext>): string | number | null {
        const currentId = currentState?.id;

        for (const t of this._transitions) {
            if (t.from !== '*' && t.from !== currentId) {
                continue;
            }

            if (t.condition && !t.condition(context, currentState)) {
                continue;
            }

            return t.to;
        }

        return null;
    }

    /**
     * 检查是否可以从 from 转换到 to
     */
    canTransition(
        from: string | number | null,
        to: string | number,
        context: TContext,
        currentState: IState<TContext>
    ): boolean {
        return this._transitions.some(t => {
            if (t.to !== to) return false;
            if (t.from !== '*' && t.from !== from) return false;
            if (t.condition && !t.condition(context, currentState)) return false;
            return true;
        });
    }
}

/**
 * 自动状态机 - 根据转换表自动切换状态
 */
export class AutoStateMachine<TContext = any> {
    private _fsm: import("./StateMachine").StateMachine<TContext>;
    private _table: TransitionTable<TContext>;
    private _evaluateInterval: number;
    private _lastEvaluateTime = 0;

    constructor(
        fsm: import("./StateMachine").StateMachine<TContext>,
        table: TransitionTable<TContext>,
        evaluateInterval = 0
    ) {
        this._fsm = fsm;
        this._table = table;
        this._evaluateInterval = evaluateInterval;
    }

    /**
     * 每帧更新（自动评估转换）
     */
    update(dt: number) {
        this._fsm.update(dt);

        this._lastEvaluateTime += dt * 1000;
        if (this._lastEvaluateTime >= this._evaluateInterval) {
            this._lastEvaluateTime = 0;
            this.evaluate();
        }
    }

    /**
     * 手动触发评估
     */
    evaluate() {
        const current = this._fsm.getCurrentState();
        const next = this._table.evaluate(this._fsm.context, current);
        if (next != null && next !== current?.id) {
            this._fsm.changeState(next);
        }
    }
}
