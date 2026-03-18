// @FilePath: GuideSteps.ts
/*
 * @Author: yyd
 * @Description: 常用引导步骤类型
 */

import { GuideState } from "./GuideState";

/**
 * 点击引导步骤
 * @example
 * new ClickGuideStep('step1', {
 *     getTarget: () => this.btn_start,
 *     tip: '点击开始按钮',
 *     onBeforeClick: () => this.showMask(),
 *     onAfterClick: () => this.hideMask()
 * })
 */
export class ClickGuideStep extends GuideState {
    private _config: ClickGuideConfig;
    private _clickHandler: () => void;

    constructor(id: string | number, config: ClickGuideConfig) {
        super(id);
        this._config = config;
    }

    async onEnter() {
        await this._config.onBeforeClick?.();

        const target = this._config.getTarget();
        if (!target || !cc.isValid(target)) {
            clog.warn(`ClickGuideStep[${this.id}]: target not found`);
            this.complete();
            return;
        }

        this._clickHandler = () => {
            this._config.onAfterClick?.();
            this.complete();
        };

        target.once(cc.Node.EventType.TOUCH_END, this._clickHandler);
    }

    onExit() {
        const target = this._config.getTarget();
        if (target && cc.isValid(target)) {
            target.off(cc.Node.EventType.TOUCH_END, this._clickHandler);
        }
    }

    canSkip() {
        return this._config.canSkip?.() ?? false;
    }
}

export interface ClickGuideConfig {
    getTarget: () => cc.Node;
    tip?: string;
    onBeforeClick?: () => void | Promise<void>;
    onAfterClick?: () => void | Promise<void>;
    canSkip?: () => boolean;
}

/**
 * 条件等待步骤
 * @example
 * new WaitConditionStep('step2', {
 *     condition: () => this.player.level >= 2,
 *     tip: '升到2级继续',
 *     checkInterval: 500
 * })
 */
export class WaitConditionStep extends GuideState {
    private _config: WaitConditionConfig;

    constructor(id: string | number, config: WaitConditionConfig) {
        super(id);
        this._config = config;
    }

    async onEnter() {
        await this._config.onEnter?.();

        await this.waitUntil(
            this._config.condition,
            this._config.checkInterval ?? 100
        );

        this.complete();
    }

    canSkip() {
        return this._config.canSkip?.() ?? false;
    }
}

export interface WaitConditionConfig {
    condition: () => boolean | Promise<boolean>;
    tip?: string;
    checkInterval?: number;
    onEnter?: () => void | Promise<void>;
    canSkip?: () => boolean;
}

/**
 * 延时步骤
 * @example
 * new DelayStep('delay1', 2000, () => console.log('2秒后'))
 */
export class DelayStep extends GuideState {
    private _delay: number;
    private _onComplete?: () => void;

    constructor(id: string | number, delayMs: number, onComplete?: () => void) {
        super(id);
        this._delay = delayMs;
        this._onComplete = onComplete;
    }

    async onEnter() {
        await this.wait(this._delay);
        this._onComplete?.();
        this.complete();
    }
}

/**
 * 自定义异步步骤
 * @example
 * new AsyncStep('step3', async (step) => {
 *     await this.playAnimation();
 *     await this.showDialog('欢迎！');
 *     step.complete();
 * })
 */
export class AsyncStep extends GuideState {
    private _executor: (step: AsyncStep) => Promise<void>;

    constructor(id: string | number, executor: (step: AsyncStep) => Promise<void>) {
        super(id);
        this._executor = executor;
    }

    async onEnter() {
        await this._executor(this);
    }

    /** 暴露 complete 给外部调用 */
    finish() {
        this.complete();
    }
}

/**
 * 分支步骤（根据条件选择不同的下一步）
 * @example
 * new BranchStep('branch1', [
 *     { condition: () => this.isVip, nextStepId: 'vip_guide' },
 *     { condition: () => true, nextStepId: 'normal_guide' }  // 默认分支
 * ])
 */
export class BranchStep extends GuideState {
    private _branches: BranchConfig[];

    constructor(id: string | number, branches: BranchConfig[]) {
        super(id);
        this._branches = branches;
    }

    async onEnter() {
        for (const branch of this._branches) {
            const result = await branch.condition();
            if (result) {
                await this.guideFSM.goTo(branch.nextStepId);
                return;
            }
        }
        this.complete();
    }
}

export interface BranchConfig {
    condition: () => boolean | Promise<boolean>;
    nextStepId: string | number;
}

/**
 * 打开界面步骤
 * @example
 * new OpenViewStep('step4', {
 *     viewId: 'BagView',
 *     tip: '打开背包',
 *     waitClose: true  // 等待界面关闭后再进入下一步
 * })
 */
export class OpenViewStep extends GuideState {
    private _config: OpenViewConfig;

    constructor(id: string | number, config: OpenViewConfig) {
        super(id);
        this._config = config;
    }

    async onEnter() {
        await this._config.onBeforeOpen?.();

        // 这里需要根据你的 ViewMgr 实现来调整
        // $app.view.open(this._config.viewId)

        if (this._config.waitClose) {
            // 等待界面关闭
            await this.waitUntil(() => {
                // return !$app.view.isOpen(this._config.viewId)
                return true; // 替换为实际逻辑
            });
        }

        this.complete();
    }

    canSkip() {
        return this._config.canSkip?.() ?? false;
    }
}

export interface OpenViewConfig {
    viewId: string;
    tip?: string;
    waitClose?: boolean;
    onBeforeOpen?: () => void | Promise<void>;
    canSkip?: () => boolean;
}
