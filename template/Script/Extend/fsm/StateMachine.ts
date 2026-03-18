// @FilePath: StateMachine.ts
/*
 * @Author: yyd
 * @Description: 通用状态机
 */

import { IState, IStateMachine, State } from "./State";

export type TransitionCallback<TContext = any> = (
    from: IState<TContext> | null,
    to: IState<TContext> | null
) => void;

export interface StateMachineConfig<TContext = any> {
    /** 状态机名称（调试用） */
    name?: string;
    /** 初始状态ID */
    initialState?: string | number;
    /** 状态列表 */
    states?: IState<TContext>[];
    /** 共享上下文 */
    context?: TContext;
    /** 状态切换回调 */
    onTransition?: TransitionCallback<TContext>;
    /** 是否异步切换（等待 onExit/onEnter 完成） */
    async?: boolean;
}

/**
 * 通用状态机
 * @template TContext 上下文类型
 * @example
 * // 1. 定义上下文
 * interface GameContext { player: Player; score: number }
 * 
 * // 2. 创建状态机
 * const fsm = new StateMachine<GameContext>({
 *     name: 'GameFSM',
 *     context: { player, score: 0 },
 *     states: [new MenuState(), new PlayState(), new PauseState()],
 *     initialState: 'menu'
 * })
 * 
 * // 3. 启动
 * fsm.start()
 * 
 * // 4. 切换状态
 * fsm.changeState('play')
 */
export class StateMachine<TContext = any> implements IStateMachine<TContext> {
    readonly name: string;
    private _states = new Map<string | number, IState<TContext>>();
    private _current: IState<TContext> | null = null;
    private _previous: IState<TContext> | null = null;
    private _context: TContext;
    private _initialStateId: string | number | null = null;
    private _running = false;
    private _transitioning = false;
    private _pendingStateId: string | number | null = null;
    private _async: boolean;

    private _onTransition?: TransitionCallback<TContext>;

    constructor(config: StateMachineConfig<TContext> = {}) {
        this.name = config.name || 'FSM';
        this._context = config.context as TContext;
        this._initialStateId = config.initialState ?? null;
        this._onTransition = config.onTransition;
        this._async = config.async ?? false;

        config.states?.forEach(s => this.addState(s));
    }

    get context() { return this._context; }
    set context(value: TContext) { this._context = value; }
    get currentState() { return this._current; }
    get previousState() { return this._previous; }
    get currentStateId() { return this._current?.id ?? null; }
    get isRunning() { return this._running; }

    /**
     * 添加状态
     */
    addState(state: IState<TContext>): this {
        state.fsm = this;
        this._states.set(state.id, state);
        return this;
    }

    /**
     * 批量添加状态
     */
    addStates(...states: IState<TContext>[]): this {
        states.forEach(s => this.addState(s));
        return this;
    }

    /**
     * 移除状态
     */
    removeState(stateId: string | number): boolean {
        const state = this._states.get(stateId);
        if (state) {
            if (this._current === state) {
                this._current = null;
            }
            state.fsm = null;
            this._states.delete(stateId);
            return true;
        }
        return false;
    }

    /**
     * 获取状态
     */
    getState<T extends IState<TContext> = IState<TContext>>(stateId: string | number): T | undefined {
        return this._states.get(stateId) as T;
    }

    /**
     * 获取当前状态
     */
    getCurrentState(): IState<TContext> | null {
        return this._current;
    }

    /**
     * 检查是否处于某状态
     */
    isInState(stateId: string | number): boolean {
        return this._current?.id === stateId;
    }

    /**
     * 启动状态机
     */
    async start(initialStateId?: string | number) {
        if (this._running) return;
        this._running = true;

        const startId = initialStateId ?? this._initialStateId;
        if (startId != null) {
            await this._doTransition(startId);
        }
    }

    /**
     * 停止状态机
     */
    async stop() {
        if (!this._running) return;

        if (this._current) {
            await this._current.onExit(null);
        }

        this._running = false;
        this._current = null;
        this._previous = null;
    }

    /**
     * 切换状态
     */
    changeState(stateId: string | number) {
        if (!this._running) {
            clog.warn(`[${this.name}] FSM not running`);
            return;
        }

        if (this._transitioning) {
            this._pendingStateId = stateId;
            return;
        }

        if (this._async) {
            this._doTransition(stateId);
        } else {
            this._doTransitionSync(stateId);
        }
    }

    /**
     * 每帧更新
     */
    update(dt: number) {
        if (!this._running || this._transitioning) return;
        this._current?.onUpdate?.(dt);
    }

    /**
     * 重置状态机
     */
    reset() {
        this._running = false;
        this._transitioning = false;
        this._current = null;
        this._previous = null;
        this._pendingStateId = null;
    }

    /**
     * 同步切换
     */
    private _doTransitionSync(stateId: string | number) {
        const target = this._states.get(stateId);
        if (!target) {
            clog.error(`[${this.name}] State not found: ${stateId}`);
            return;
        }

        if (this._current === target) return;

        if (this._current?.canExit?.(target) === false) {
            return;
        }
        if (target.canEnter?.(this._current) === false) {
            return;
        }

        const from = this._current;
        this._transitioning = true;

        from?.onExit(target);
        this._previous = from;
        this._current = target;
        this._onTransition?.(from, target);
        target.onEnter(from);

        this._transitioning = false;
        this._processPending();
    }

    /**
     * 异步切换
     */
    private async _doTransition(stateId: string | number) {
        const target = this._states.get(stateId);
        if (!target) {
            clog.error(`[${this.name}] State not found: ${stateId}`);
            return;
        }

        if (this._current === target) return;

        if (this._current?.canExit?.(target) === false) {
            return;
        }
        if (target.canEnter?.(this._current) === false) {
            return;
        }

        const from = this._current;
        this._transitioning = true;

        await from?.onExit(target);
        this._previous = from;
        this._current = target;
        this._onTransition?.(from, target);
        await target.onEnter(from);

        this._transitioning = false;
        this._processPending();
    }

    /**
     * 处理待处理的状态切换
     */
    private _processPending() {
        if (this._pendingStateId != null) {
            const pending = this._pendingStateId;
            this._pendingStateId = null;
            this.changeState(pending);
        }
    }
}
