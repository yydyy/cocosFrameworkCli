// @FilePath: GuideFSM.ts
/*
 * @Author: yyd
 * @Description: 引导状态机（基于通用状态机）
 */

import { StateMachine } from "../fsm/StateMachine";
import { GuideState, GuideContext, IGuideFSM } from "./GuideState";
import { IState } from "../fsm/State";

export type GuideProgress = {
    guideId: string | number;
    stepIndex: number;
    completed: boolean;
};

export type GuideFSMConfig = {
    /** 引导ID */
    id: string | number;
    /** 步骤列表 */
    steps: GuideState[];
    /** 共享上下文 */
    context?: GuideContext;
    /** 保存进度回调 */
    onSaveProgress?: (progress: GuideProgress) => void;
    /** 加载进度回调 */
    onLoadProgress?: () => GuideProgress | null;
    /** 引导完成回调 */
    onComplete?: () => void;
    /** 步骤切换回调 */
    onStepChange?: (from: GuideState | null, to: GuideState | null) => void;
};

/**
 * 引导状态机
 * 继承自通用 StateMachine，添加引导特有功能：
 * - 顺序执行（next）
 * - 跳过检测（canSkip）
 * - 进度保存/恢复
 */
export class GuideFSM extends StateMachine<GuideContext> implements IGuideFSM {
    private _steps: GuideState[] = [];
    private _currentIndex = -1;
    private _guideCompleted = false;
    private _paused = false;

    private _onSaveProgress?: (progress: GuideProgress) => void;
    private _onLoadProgress?: () => GuideProgress | null;
    private _onGuideComplete?: () => void;
    private _onStepChange?: (from: GuideState | null, to: GuideState | null) => void;

    constructor(config: GuideFSMConfig) {
        super({
            name: `Guide_${config.id}`,
            context: config.context || {},
            async: true
        });

        this._steps = config.steps;
        this._onSaveProgress = config.onSaveProgress;
        this._onLoadProgress = config.onLoadProgress;
        this._onGuideComplete = config.onComplete;
        this._onStepChange = config.onStepChange;

        this._steps.forEach(step => this.addState(step));
    }

    get currentStep() { return this.currentState as GuideState | null; }
    get currentIndex() { return this._currentIndex; }
    get isGuideCompleted() { return this._guideCompleted; }
    get isPaused() { return this._paused; }
    get totalSteps() { return this._steps.length; }

    /**
     * 开始引导（自动从保存的进度恢复）
     */
    override async start() {
        if (this.isRunning) return;

        const progress = this._onLoadProgress?.();
        if (progress?.completed) {
            this._guideCompleted = true;
            return;
        }

        this._guideCompleted = false;
        this._currentIndex = progress?.stepIndex ?? -1;

        await super.start();
        await this.next();
    }

    /**
     * 从指定步骤索引开始
     */
    async startFromIndex(stepIndex: number) {
        if (this.isRunning) return;

        this._guideCompleted = false;
        this._currentIndex = stepIndex - 1;

        await super.start();
        await this.next();
    }

    /**
     * 切换到下一步
     */
    async next() {
        if (!this.isRunning || this._paused) return;

        const prev = this.currentStep;
        if (prev) {
            await prev.onExit(null);
        }

        this._currentIndex++;

        while (this._currentIndex < this._steps.length) {
            const step = this._steps[this._currentIndex];

            const canSkip = await step.canSkip();
            if (canSkip) {
                this._currentIndex++;
                continue;
            }

            const canEnter = step.canEnter?.(prev) ?? true;
            if (!canEnter) {
                this._currentIndex++;
                continue;
            }

            break;
        }

        if (this._currentIndex >= this._steps.length) {
            this._finishGuide(prev);
            return;
        }

        const nextStep = this._steps[this._currentIndex];
        this._onStepChange?.(prev, nextStep);
        this._saveProgress();

        this.changeState(nextStep.id);
    }

    /**
     * 跳转到指定步骤
     */
    async goTo(stepId: string | number) {
        const index = this._steps.findIndex(s => s.id === stepId);
        if (index === -1) {
            clog.error(`Guide step not found: ${stepId}`);
            return;
        }

        const prev = this.currentStep;
        if (prev) {
            await prev.onExit(null);
        }

        this._currentIndex = index;
        const nextStep = this._steps[index];
        this._onStepChange?.(prev, nextStep);
        this._saveProgress();

        this.changeState(stepId);
    }

    /**
     * 暂停引导
     */
    pause() {
        this._paused = true;
    }

    /**
     * 恢复引导
     */
    resume() {
        if (!this._paused) return;
        this._paused = false;
        this.currentStep?.resume();
    }

    /**
     * 停止引导
     */
    override async stop() {
        this._paused = false;
        await super.stop();
    }

    /**
     * 重置引导
     */
    override reset() {
        super.reset();
        this._paused = false;
        this._guideCompleted = false;
        this._currentIndex = -1;
        this._steps.forEach(s => s.reset());
    }

    /**
     * 根据ID获取步骤
     */
    getStep<T extends GuideState = GuideState>(stepId: string | number): T | undefined {
        return this.getState<T>(stepId);
    }

    /**
     * 重写 update，支持暂停
     */
    override update(dt: number) {
        if (this._paused) return;
        super.update(dt);
    }

    private _finishGuide(prev: GuideState | null) {
        this._guideCompleted = true;
        this._onStepChange?.(prev, null);
        this._saveProgress();
        this._onGuideComplete?.();
        this.stop();
    }

    private _saveProgress() {
        this._onSaveProgress?.({
            guideId: this.name.replace('Guide_', ''),
            stepIndex: this._currentIndex,
            completed: this._guideCompleted
        });
    }
}
