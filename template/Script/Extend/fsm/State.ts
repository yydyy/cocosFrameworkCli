// @FilePath: State.ts
/*
 * @Author: yyd
 * @Description: 通用状态基类
 */

export interface IStateMachine<TContext = any> {
    readonly context: TContext;
    changeState(stateId: string | number): void;
    getCurrentState(): IState<TContext> | null;
}

export interface IState<TContext = any> {
    readonly id: string | number;
    fsm: IStateMachine<TContext> | null;
    onEnter(from: IState<TContext> | null): void | Promise<void>;
    onExit(to: IState<TContext> | null): void | Promise<void>;
    onUpdate?(dt: number): void;
    canEnter?(from: IState<TContext> | null): boolean;
    canExit?(to: IState<TContext> | null): boolean;
}

/**
 * 通用状态基类
 * @template TContext 状态机上下文类型
 */
export abstract class State<TContext = any> implements IState<TContext> {
    readonly id: string | number;
    private _fsm: IStateMachine<TContext> | null = null;

    constructor(id: string | number) {
        this.id = id;
    }

    get fsm() { return this._fsm; }
    set fsm(value: IStateMachine<TContext> | null) { this._fsm = value; }

    /** 状态机上下文（共享数据） */
    get context(): TContext { return this._fsm?.context as TContext; }

    /**
     * 进入状态
     * @param from 来源状态
     */
    onEnter(from: IState<TContext> | null): void | Promise<void> { }

    /**
     * 退出状态
     * @param to 目标状态
     */
    onExit(to: IState<TContext> | null): void | Promise<void> { }

    /**
     * 每帧更新
     */
    onUpdate?(dt: number): void;

    /**
     * 是否可以进入此状态
     */
    canEnter?(from: IState<TContext> | null): boolean;

    /**
     * 是否可以退出此状态
     */
    canExit?(to: IState<TContext> | null): boolean;

    /**
     * 切换到另一个状态
     */
    protected changeTo(stateId: string | number) {
        this._fsm?.changeState(stateId);
    }
}

/**
 * 函数式状态（快速创建简单状态）
 */
export class FuncState<TContext = any> extends State<TContext> {
    private _config: FuncStateConfig<TContext>;

    constructor(id: string | number, config: FuncStateConfig<TContext>) {
        super(id);
        this._config = config;
    }

    onEnter(from: IState<TContext> | null) {
        return this._config.onEnter?.call(this, from);
    }

    onExit(to: IState<TContext> | null) {
        return this._config.onExit?.call(this, to);
    }

    onUpdate(dt: number) {
        this._config.onUpdate?.call(this, dt);
    }

    canEnter(from: IState<TContext> | null) {
        return this._config.canEnter?.call(this, from) ?? true;
    }

    canExit(to: IState<TContext> | null) {
        return this._config.canExit?.call(this, to) ?? true;
    }
}

export interface FuncStateConfig<TContext = any> {
    onEnter?: (this: FuncState<TContext>, from: IState<TContext> | null) => void | Promise<void>;
    onExit?: (this: FuncState<TContext>, to: IState<TContext> | null) => void | Promise<void>;
    onUpdate?: (this: FuncState<TContext>, dt: number) => void;
    canEnter?: (this: FuncState<TContext>, from: IState<TContext> | null) => boolean;
    canExit?: (this: FuncState<TContext>, to: IState<TContext> | null) => boolean;
}
