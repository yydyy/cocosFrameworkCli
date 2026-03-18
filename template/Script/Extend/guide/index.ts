// @FilePath: index.ts
/*
 * @Author: yyd
 * @Description: 引导系统导出
 */

export { GuideState, type IGuideFSM, type GuideContext } from "./GuideState";
export { GuideFSM, type GuideProgress } from "./GuideFSM";
export { GuideMgr, LocalGuideStorage, type IGuideStorage } from "./GuideMgr";
export {
    ClickGuideStep,
    WaitConditionStep,
    DelayStep,
    AsyncStep,
    BranchStep,
    OpenViewStep,
    type ClickGuideConfig,
    type WaitConditionConfig,
    type BranchConfig,
    type OpenViewConfig
} from "./GuideSteps";
