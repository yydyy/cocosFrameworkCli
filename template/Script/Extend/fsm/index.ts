// @FilePath: index.ts
/*
 * @Author: yyd
 * @Description: 通用状态机框架导出
 */

export {
    State,
    FuncState,
    type IState,
    type IStateMachine,
    type FuncStateConfig
} from "./State";

export {
    StateMachine,
    type StateMachineConfig,
    type TransitionCallback
} from "./StateMachine";

export {
    TransitionTable,
    AutoStateMachine,
    type ITransition
} from "./Transition";

export {
    HierarchicalState,
    ParallelState,
    type ParallelMachineConfig
} from "./HierarchicalState";
