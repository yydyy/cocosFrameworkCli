// @FilePath: HierarchicalState.ts
/*
 * @Author: yyd
 * @Description: 层级状态（支持子状态机）
 */

import { IState, State } from "./State";
import { StateMachine } from "./StateMachine";

/**
 * 层级状态 - 包含子状态机的状态
 * @template TContext 上下文类型
 * @example
 * // 战斗状态包含子状态机：待机、攻击、受伤、死亡
 * class BattleState extends HierarchicalState<GameContext> {
 *     constructor() {
 *         super('battle');
 *         this.subMachine
 *             .addState(new IdleState())
 *             .addState(new AttackState())
 *             .addState(new HurtState());
 *     }
 *     
 *     onEnter(from) {
 *         super.onEnter(from);  // 启动子状态机
 *         this.subMachine.changeState('idle');
 *     }
 * }
 */
export class HierarchicalState<TContext = any> extends State<TContext> {
    protected _subMachine: StateMachine<TContext>;
    private _initialSubState: string | number | null = null;

    constructor(id: string | number, initialSubState?: string | number) {
        super(id);
        this._initialSubState = initialSubState ?? null;
        this._subMachine = new StateMachine<TContext>({
            name: `${id}_sub`
        });
    }

    /** 子状态机 */
    get subMachine() { return this._subMachine; }

    /** 当前子状态 */
    get currentSubState() { return this._subMachine.currentState; }

    override set fsm(value) {
        super.fsm = value;
        if (value) {
            this._subMachine.context = value.context;
        }
    }

    override get fsm() {
        return super.fsm;
    }

    async onEnter(from: IState<TContext> | null) {
        if (this._initialSubState != null) {
            await this._subMachine.start(this._initialSubState);
        }
    }

    async onExit(to: IState<TContext> | null) {
        await this._subMachine.stop();
    }

    onUpdate(dt: number) {
        this._subMachine.update(dt);
    }

    /**
     * 切换子状态
     */
    changeSubState(subStateId: string | number) {
        this._subMachine.changeState(subStateId);
    }
}

/**
 * 并行状态 - 同时运行多个状态机
 * @example
 * // 角色可以同时处于移动状态和动作状态
 * class CharacterState extends ParallelState<GameContext> {
 *     constructor() {
 *         super('character', [
 *             { name: 'movement', states: [new IdleMove(), new WalkMove(), new RunMove()] },
 *             { name: 'action', states: [new IdleAction(), new AttackAction(), new SkillAction()] }
 *         ]);
 *     }
 * }
 */
export class ParallelState<TContext = any> extends State<TContext> {
    private _machines = new Map<string, StateMachine<TContext>>();

    constructor(id: string | number, configs: ParallelMachineConfig<TContext>[]) {
        super(id);
        configs.forEach(cfg => {
            const machine = new StateMachine<TContext>({
                name: `${id}_${cfg.name}`,
                states: cfg.states,
                initialState: cfg.initialState
            });
            this._machines.set(cfg.name, machine);
        });
    }

    override set fsm(value) {
        super.fsm = value;
        if (value) {
            this._machines.forEach(m => m.context = value.context);
        }
    }

    override get fsm() {
        return super.fsm;
    }

    /**
     * 获取子状态机
     */
    getMachine(name: string): StateMachine<TContext> | undefined {
        return this._machines.get(name);
    }

    /**
     * 切换指定状态机的状态
     */
    changeState(machineName: string, stateId: string | number) {
        this._machines.get(machineName)?.changeState(stateId);
    }

    async onEnter(from: IState<TContext> | null) {
        for (const [_, machine] of this._machines) {
            await machine.start();
        }
    }

    async onExit(to: IState<TContext> | null) {
        for (const [_, machine] of this._machines) {
            await machine.stop();
        }
    }

    onUpdate(dt: number) {
        this._machines.forEach(m => m.update(dt));
    }
}

export interface ParallelMachineConfig<TContext = any> {
    name: string;
    states: IState<TContext>[];
    initialState?: string | number;
}
