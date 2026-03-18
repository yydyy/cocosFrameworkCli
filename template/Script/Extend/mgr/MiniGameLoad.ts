// @FilePath: MiniGameLoad.ts


/*
 * @Author: yyd
 * @Date: 2024-04-08 19:06:55
 * @LastEditTime: 2026-01-01 17:35:34
 * @FilePath: \cocosTools\assets\Script\Extend\mgr\MiniGameLoad.ts
 * @Description:  小游戏资源加载队列  在loadMgr中联合使用 处理暂停恢复等逻辑
 * 不占用外部操作的加载逻辑 比如界面的打开等 不然线程并发数会超过限制 影响游戏体验
 * 所以次要资源一般是加载bundle包就行了,也是防止把内存撑爆
 */

/**加载权重 */
export enum LoadPriority {
    Lv1 = 1, Lv2 = 2, Lv3 = 3, Lv4 = 4, Lv5 = 5,
    Lv6 = 6, Lv7 = 7, Lv8 = 8, Lv9 = 9
}

/** 队列资源加载状态 */
enum LoadState {
    PENDING,       // 等待
    LOADING_BUNDLE, // Bundle加载中
    LOADING_ASSET,  // 资源加载中
    FAILED,        // 失败（可重试）
    PAUSED,        // 暂停
    COMPLETED      // 完成
}

/** 加载任务元数据 */
@$gb.Identifiable
class LoadTask {
    private _state: LoadState = LoadState.PENDING;
    get state() {
        return this._state
    }
    set state(v: LoadState) {
        this._state = v
        clog.model("LoadTask 设置状态", "path:%s state:%s".format(this.path, LoadState[v]))
    }
    priority: LoadPriority;
    path: string;
    retryCount: number = 0;
    createdAt: number = Date.now();
    isPre: boolean = false//是否是预加载
    callback?: (error: Error | null, assets?: cc.Asset | cc.Asset[]) => void;

    constructor(path: string, priority: LoadPriority, isPre?: boolean, callback?: LoadTask['callback']) {
        this.path = path;
        this.priority = priority;
        this.isPre = isPre
        this.callback = callback;
    }
}

const MAX_RETRY = 2;
const TASK_TIMEOUT = 15000;
class PriorityQueue {
    private heap: LoadTask[] = [];

    get size() { return this.heap.length; }
    isEmpty() { return this.heap.length === 0; }

    enqueue(task: LoadTask) {
        this.heap.push(task);
        this.bubbleUp(this.heap.length - 1);
    }

    dequeue(): LoadTask | null {
        if (this.isEmpty()) return null;
        const first = this.heap[0];
        const last = this.heap.pop()!;

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }
        return first;
    }

    updatePriority(path: string, newPriority: LoadPriority) {
        const index = this.heap.findIndex(t => t.path === path);
        if (index === -1) return;

        const oldPriority = this.heap[index].priority;
        this.heap[index].priority = newPriority;

        if (newPriority > oldPriority) this.bubbleUp(index);
        else this.sinkDown(index);
    }

    private bubbleUp(index: number) {
        const element = this.heap[index];
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];

            if (this.compare(element, parent) >= 0) break;

            this.heap[parentIndex] = element;
            this.heap[index] = parent;
            index = parentIndex;
        }
    }

    private sinkDown(index: number) {
        const element = this.heap[index];
        const length = this.heap.length;

        while (true) {
            const leftIndex = 2 * index + 1;
            const rightIndex = 2 * index + 2;
            let swapIndex = -1;

            if (leftIndex < length) {
                const leftChild = this.heap[leftIndex];
                if (this.compare(leftChild, element) < 0) {
                    swapIndex = leftIndex;
                }
            }

            if (rightIndex < length) {
                const rightChild = this.heap[rightIndex];
                const compareWith = swapIndex === -1 ? element : this.heap[swapIndex];

                if (this.compare(rightChild, compareWith) < 0) {
                    swapIndex = rightIndex;
                }
            }

            if (swapIndex === -1) break;

            this.heap[index] = this.heap[swapIndex];
            this.heap[swapIndex] = element;
            index = swapIndex;
        }
    }

    private compare(a: LoadTask, b: LoadTask): number {
        return b.priority - a.priority || a.createdAt - b.createdAt;
    }
}
@$gb.Identifiable
class MiniGameLoad {
    private taskQueue = new PriorityQueue();
    private activeTasks = new Map<string, LoadTask>();
    private pendingTimeout: number | null = null;
    private pauseCount: number = 0;
    private concurrency: number;//并发数  

    constructor(options: { concurrency?: number } = {}) {
        this.concurrency = options.concurrency || 1;
    }

    //条件
    get isECondition() {
        return $app.platform.isWeb || $app.platform.isNative
    }

    /**
     * 加载任务
     * @param path 格式: 包名.资源路径.资源类型(资源类型可选,不存在就是资源目录) 例如 hall.view/HallView.prefab
     * @param priority 优先级
     * @param isPre 是否是预加载
     * @param callback 加载完成的回调
     * @returns 
     */
    addTask(path: string, priority: LoadPriority, isPre?: boolean, callback?: LoadTask['callback']) {
        // 检查是否已存在相同路径的活跃任务
        if (this.activeTasks.has(path)) {
            const existing = this.activeTasks.get(path)!;
            if (priority > existing.priority) {
                existing.priority = priority;
                existing.callback = callback;
                this.taskQueue.updatePriority(path, priority);
            }
            return;
        }
        // 创建新任务
        const task = new LoadTask(path, priority, isPre, callback);
        this.taskQueue.enqueue(task);
        this.scheduleProcess();
    }
    addTasks(
        paths: string | string[],
        priorities: LoadPriority | LoadPriority[], isPres?: boolean | boolean[],
        callbacks?: LoadTask['callback'] | LoadTask['callback'][]
    ) {
        const pathArray = Array.isArray(paths) ? paths : [paths];
        const priorityArray = Array.isArray(priorities) ? priorities : [priorities];
        const callbackArray = callbacks
            ? (Array.isArray(callbacks) ? callbacks : [callbacks])
            : [];
        const isPreArray = isPres ? (Array.isArray(isPres) ? isPres : [isPres]) : [];

        pathArray.forEach((path, index) => {
            const priority = priorityArray[Math.min(index, priorityArray.length - 1)];
            const callback = callbackArray[index] || (callbackArray[0] ?? undefined);
            const isPre = isPreArray[index] ?? false;
            this.addTask(path, priority, isPre, callback);
        });
    }
    pause() {
        this.pauseCount++;
        if (this.pauseCount === 1) { // 首次暂停
            this.activeTasks.size && clog.model("MinLoadTask暂停")
            // 清除待处理超时
            if (this.pendingTimeout !== null) {
                clearTimeout(this.pendingTimeout);
                this.pendingTimeout = null;
            }

            // 暂停所有活动任务
            this.activeTasks.forEach(task => {
                if (task.state === LoadState.LOADING_BUNDLE ||
                    task.state === LoadState.LOADING_ASSET) {
                    task.state = LoadState.PAUSED;
                }
            });
        }
    }
    resume() {
        if (this.pauseCount > 0) {
            this.pauseCount--;
            if (this.pauseCount === 0) {
                this.activeTasks.size && clog.model("MinLoadTask恢复")
                this.scheduleProcess();
            }
        }
    }

    private scheduleProcess() {
        if (this.pendingTimeout !== null || this.pauseCount > 0) return;
        this.pendingTimeout = setTimeout(() => {
            this.pendingTimeout = null;
            this.processQueue();
        }, 0) as unknown as number;
    }

    private async processQueue() {
        while (this.pauseCount === 0 &&
            this.activeTasks.size < this.concurrency &&
            !this.taskQueue.isEmpty()) {
            const task = this.taskQueue.dequeue();
            if (!task) break;
            task.state = LoadState.LOADING_BUNDLE;
            this.activeTasks.set(task.path, task);
            try {
                const assets = await this.executeTask(task);
                task.state = LoadState.COMPLETED;
                task.callback?.(null, assets);
            } catch (error) {
                this.handleTaskError(task, error);
            } finally {
                this.activeTasks.delete(task.path);
                this.scheduleProcess(); // 继续处理下一个
            }
        }
    }
    private async executeTask(task: LoadTask): Promise<cc.Asset | cc.Asset[]> {
        const [bundleName, nativePath, type] = task.path.split(".");
        // 加载bundle
        const bundle = await this.loadResource<cc.AssetManager.Bundle>(
            (resolve, reject) => {
                cc.assetManager.loadBundle(bundleName, (err, bundle) => {
                    err ? reject(err) : resolve(bundle!);
                });
            }
        );
        // 更新状态为资源加载
        task.state = LoadState.LOADING_ASSET;
        // 加载资源
        if (type) {
            return this.loadResource<cc.Asset>(
                (resolve, reject) => {
                    const fun = bundle[task.isPre ? "preload" : "load"]
                    //@ts-ignore
                    fun.call(bundle, nativePath, (err, asset) => {
                        err ? null : clog.model(task.isPre ? "MinLoadTask asset预加载完成" : "MinLoadTask asset加载完成", "path:%s".format(task.path))
                        err ? reject(err) : resolve(asset!);
                    });
                }
            );
        } else {
            return this.loadResource<cc.Asset[]>(
                (resolve, reject) => {
                    const fun = bundle[task.isPre ? "preloadDir" : "loadDir"]
                    //@ts-ignore
                    fun.call(bundle, nativePath, (err, assets) => {
                        err ? null : clog.model(task.isPre ? "MinLoadTask dir预加载完成" : "MinLoadTask dir加载完成", "path:%s".format(task.path))
                        err ? reject(err) : resolve(assets!);
                    });
                }
            );
        }
    }
    private loadResource<T>(loader: (resolve: (value: T) => void, reject: (reason?: any) => void) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error("Load timeout"));
            }, TASK_TIMEOUT);
            loader(
                (result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                },
                (error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            );
        });
    }

    private handleTaskError(task: LoadTask, error: any) {
        if (task.retryCount < MAX_RETRY) {
            task.retryCount++;
            task.state = LoadState.PENDING;
            this.taskQueue.enqueue(task);
        } else {
            task.state = LoadState.FAILED;
            task.callback?.(error instanceof Error ? error : new Error(String(error)));
        }
    }

}
export const MiniLoadTask = $gb.SingleFunc(MiniGameLoad)