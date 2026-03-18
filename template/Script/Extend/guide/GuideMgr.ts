// @FilePath: GuideMgr.ts
/*
 * @Author: yyd
 * @Description: 引导管理器
 */

import { GuideFSM, GuideProgress } from "./GuideFSM";

/**
 * 引导管理器
 * @example
 * // 1. 创建引导
 * const guide = GuideMgr.Ins().create({
 *     id: 'newbie',
 *     steps: [new Step1(), new Step2(), new Step3()],
 *     onComplete: () => console.log('引导完成')
 * })
 * 
 * // 2. 开始引导
 * guide.start()
 * 
 * // 3. 或者获取已有引导
 * GuideMgr.Ins().get('newbie')?.start()
 */

@$gb.Identifiable
class _GuideMgr {
    private _guides = new Map<string | number, GuideFSM>();
    private _storage: IGuideStorage | null = null;

    /**
     * 设置存储适配器
     */
    setStorage(storage: IGuideStorage) {
        this._storage = storage;
    }

    /**
     * 创建引导
     */
    create(config: {
        id: string | number;
        steps: import("./GuideState").GuideState[];
        onComplete?: () => void;
        onStepChange?: (from: any, to: any) => void;
    }): GuideFSM {
        const fsm = new GuideFSM({
            ...config,
            onSaveProgress: (p) => this._saveProgress(p),
            onLoadProgress: () => this._loadProgress(config.id),
        });

        this._guides.set(config.id, fsm);
        return fsm;
    }

    /**
     * 获取引导
     */
    get(guideId: string | number): GuideFSM | undefined {
        return this._guides.get(guideId);
    }

    /**
     * 移除引导
     */
    remove(guideId: string | number) {
        const guide = this._guides.get(guideId);
        if (guide) {
            guide.stop();
            this._guides.delete(guideId);
        }
    }

    /**
     * 检查引导是否已完成
     */
    isCompleted(guideId: string | number): boolean {
        const progress = this._loadProgress(guideId);
        return progress?.completed ?? false;
    }

    /**
     * 重置引导进度
     */
    resetProgress(guideId: string | number) {
        this._storage?.remove(guideId);
        this._guides.get(guideId)?.reset();
    }

    /**
     * 每帧更新（需要在游戏主循环调用）
     */
    update(dt: number) {
        this._guides.forEach(guide => guide.update(dt));
    }

    private _saveProgress(progress: GuideProgress) {
        this._storage?.save(progress);
    }

    private _loadProgress(guideId: string | number): GuideProgress | null {
        return this._storage?.load(guideId) ?? null;
    }
}
export const GuideMgr = $gb.SingletonProxy(_GuideMgr)

/**
 * 引导存储接口
 */
export interface IGuideStorage {
    save(progress: GuideProgress): void;
    load(guideId: string | number): GuideProgress | null;
    remove(guideId: string | number): void;
}

/**
 * LocalStorage 存储实现
 */
export class LocalGuideStorage implements IGuideStorage {
    private _prefix: string;

    constructor(prefix = 'guide_') {
        this._prefix = prefix;
    }

    save(progress: GuideProgress) {
        const key = this._prefix + progress.guideId;
        cc.sys.localStorage.setItem(key, JSON.stringify(progress));
    }

    load(guideId: string | number): GuideProgress | null {
        const key = this._prefix + guideId;
        const data = cc.sys.localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    remove(guideId: string | number) {
        const key = this._prefix + guideId;
        cc.sys.localStorage.removeItem(key);
    }
}
