// @FilePath: Coroutine.ts

/*
 * @Author: yyd
 * @Date: 2022-07-06 13:51:04
 * @LastEditTime: 2025-09-22 11:49:34
 * @FilePath: \cocosTools\assets\Script\Extend\Coroutine.ts
 * @Description:  ts协成
 */


/**使用方式

class Test {
    * test(...args: any[]) {
        // args.forEach(v=>{
        //     log(v);
        // })

        log("test coroutine start")
        const t = 10
        yield Coroutine.createWaitTimeFrame(t)
        log("延时%s完成".format(t))
        yield Coroutine.createWaitFrame()
        log("每帧完成")
        yield Coroutine.createWaitUntil(() => {
            const n = $app.tool.random(0, 9)
            // log("条件检查 dt=%s".format(n))
            n > 8 && log("条件真正完成")
            return n > 8
        })
        log("条件完成")
        yield Coroutine.createWaitPromise(new Promise((resolve, reject) => {
            setTimeout(() => {
                log("Promise真正的完成")
                resolve(0)
            }, 2000)
        }), false)
        log("Promise完成")
    }
}
new Coroutine();
const t = new Test();
Coroutine.startAsync(t.test, t);
log("直线运行完成")


 */
class Timer {
    recodeTime: number = 0;

    reset() {
        this.recodeTime = 0;
    }
}


class CoroutinePool {
    private static _pool: ICoroutine[] = [];

    static get(): ICoroutine {
        if (this._pool.length > 0) {
            return this._pool.pop()!;
        }
        return {
            iterator: null!,
            timer: new Timer(),
            target: null,
            fun: null,
            type: "time",
            isBlocking: true,
            priority: 1
        };
    }

    static release(info: ICoroutine) {
        info.iterator = null!;
        info.target = null;
        info.fun = null;
        info.type = "time";
        info.condition = undefined;
        info.promise = undefined;
        info.promiseState = undefined;
        info.isBlocking = true;
        info.priority = 1
        info.timer.reset();

        this._pool.push(info);
    }
}

interface ICoroutine {
    iterator: Generator<any, any, any>;
    timer: Timer;
    target: any;
    fun: any;
    type: "time" | "frame" | "condition" | "promise";
    condition?: () => boolean;
    promise?: Promise<any>;
    isBlocking?: boolean;
    promiseState?: "pending" | "resolved" | "rejected";
    priority: number;
}

@$gb.Identifiable
class _Coroutine {
    private _id: string
    private _groups: Record<string, ICoroutine[]> = {};
    private _defaultGroup = "default";
    private _frameCount: number = 0;

    constructor() {
        this._id = "_Coroutine_uuid"
        cc.game.on(cc.game.EVENT_GAME_INITED, () => {
            cc.director.getScheduler().schedule(
                this._update.bind(this),
                this,
                0,
                false
            );
        });
        // setInterval(() => {
        //     this._update(0)
        // }, 0);
    }

    startAsync(func: string | Function, target: any, group?: string, priority: number = 1, ...params: any[]) {
        if (!cc.isValid(target, true) || !func) return;

        let iterator: Generator;
        if (func instanceof Function) {
            iterator = func.call(target, ...params);
        } else {
            iterator = target[func](...params);
        }

        const groupName = group || this._defaultGroup;
        if (!this._groups[groupName]) {
            this._groups[groupName] = [];
        }

        // 检查是否已存在相同协程
        const exists = this._groups[groupName].some(info =>
            info.fun === func && info.target === target
        );
        if (exists) return;

        const firstYield = iterator.next().value;
        const timer = new Timer();
        timer.recodeTime = Date.now() + (firstYield?.delay ?? 0);

        const type = firstYield?.type || "time";

        const info = CoroutinePool.get();
        info.iterator = iterator;
        info.timer = timer;
        info.target = target;
        info.fun = func;
        info.type = type;
        info.condition = firstYield?.condition;
        info.promise = firstYield?.promise;
        info.isBlocking = true;
        info.priority = priority;

        if (firstYield?.type === "promise") {
            info.promiseState = "pending";
            firstYield.promise.then(() => {
                info.promiseState = "resolved";
            }).catch(() => {
                info.promiseState = "rejected";
            });
        }

        this._groups[groupName].push(info);
        this._sortGroup(groupName);
    }

    stopAsync(target?: any, func?: Function | string) {
        if (!func && !target) {
            this.stopAllGroups();
            return;
        }

        Object.keys(this._groups).forEach(group => {
            this._groups[group] = this._groups[group].filter(info => {
                const match = (info.fun === func || info.target === target);
                if (match) {
                    CoroutinePool.release(info);
                }
                return !match;
            });
        });
    }

    stopGroup(group: string) {
        if (this._groups[group]) {
            this._groups[group].forEach(info => CoroutinePool.release(info));
            delete this._groups[group];
        }
    }

    stopAllGroups() {
        Object.keys(this._groups).forEach(group => {
            this.stopGroup(group);
        });
    }

    private _sortGroup(group: string) {
        if (this._groups[group]) {
            this._groups[group].sort((a, b) => a.priority - b.priority);
        }
    }

    private _update(dt: number) {
        this._frameCount++;
        const now = Date.now();
        const MAX_PROCESS_PER_FRAME = 100;
        let processedCount = 0;

        Object.keys(this._groups).forEach(group => {
            const groupList = this._groups[group];
            const toRemove: number[] = [];

            for (let i = 0; i < groupList.length && processedCount < MAX_PROCESS_PER_FRAME; i++) {
                const info = groupList[i];

                // 检查目标是否有效
                if (!cc.isValid(info.target, true)) {
                    toRemove.push(i);
                    continue;
                }

                let isAyscall = false;
                let shouldExecute = false;

                try {
                    // 判断协程是否应该执行
                    switch (info.type) {
                        case "time":
                            shouldExecute = now >= info.timer.recodeTime;
                            break;
                        case "frame":
                            shouldExecute = true;
                            break;
                        case "condition":
                            // 使用try-catch保护条件函数执行
                            try {
                                isAyscall = info.condition?.() ?? false;
                            } catch (e) {
                                cc.error(`协程条件检查出错:`, e);
                                isAyscall = true; // 视为条件满足，继续执行
                            }
                            shouldExecute = info.isBlocking ? isAyscall : true;
                            break;
                        case "promise":
                            if (info.promise) {
                                isAyscall = info.promiseState === "resolved" || info.promiseState === "rejected";
                                shouldExecute = info.isBlocking ? isAyscall : true;
                            }
                            break;
                    }

                    if (shouldExecute) {
                        // 执行协程并处理结果
                        const result = info.iterator.next();
                        processedCount++;

                        if (result.done) {
                            toRemove.push(i);
                            CoroutinePool.release(info);
                        } else {
                            const nextYield = result.value;
                            info.type = nextYield?.type || "time";
                            info.timer.recodeTime = Date.now() + (nextYield?.delay ?? 0);
                            info.condition = nextYield?.condition;
                            info.isBlocking = nextYield?.isBlocking ?? true;

                            if (nextYield?.type === "promise") {
                                info.promise = nextYield.promise;
                                info.promiseState = "pending";

                                // 使用try-catch保护Promise处理
                                try {
                                    nextYield.promise.then(() => {
                                        info.promiseState = "resolved";
                                    }).catch((e) => {
                                        cc.error(`协程Promise出错:`, e);
                                        info.promiseState = "rejected";
                                    });
                                } catch (e) {
                                    cc.error(`协程Promise处理出错:`, e);
                                    info.promiseState = "rejected";
                                }
                            } else {
                                info.promise = undefined;
                                info.promiseState = undefined;
                            }
                        }
                    }
                } catch (e) {
                    // 异常处理：记录错误并移除协程
                    const targetName = info.target?.constructor?.name || "未知目标";
                    const funcName = typeof info.fun === 'string' ? info.fun : info.fun?.name || "匿名函数";

                    cc.error(`[协程错误] 组: ${group}, 目标: ${targetName}, 方法: ${funcName}`);
                    cc.error(e);

                    toRemove.push(i);
                    CoroutinePool.release(info);
                }
            }

            // 从后往前移除无效协程
            toRemove.sort((a, b) => b - a).forEach(index => {
                groupList.splice(index, 1);
            });
        });
    }

    static createWaitTimeFrame(delay: number) {
        return { type: "time", delay };
    }

    static createWaitFrame() {
        return { type: "frame" };
    }

    static createWaitUntil(condition: () => boolean, isBlocking: boolean = true) {
        return { type: "condition", condition, isBlocking };
    }

    static createWaitPromise(promise: Promise<any>, isBlocking: boolean = true) {
        return { type: "promise", promise, isBlocking };
    }

}
export const Coroutine = $gb.SingleFunc(_Coroutine)