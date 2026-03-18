// @FilePath: LoadMgr.ts

/*
 * @Author: yyd
 * @Date: 2024-04-08 19:06:55
 * @LastEditTime: 2026-03-03 09:35:18
 * @FilePath: \cocosTools\assets\Script\Extend\mgr\LoadMgr.ts
 * @Description:  资源加载Mgr
 */

import { AutoReleaseAsset } from "../ui/AutoReleaseAsset"
import { ReleaseType } from "./ReleaseType"
/**
 * 回调类型
 */
type onProgressFun = (finish: number, total: number, item: cc.AssetManager.RequestItem) => void
type onCompleteFun = (err: Error, item: cc.Asset | any) => void
type onBundleFun = (err: Error, bundle: cc.AssetManager.Bundle) => void

var cacheAssemblerInfos: ccArrayType<AssemblerAssetInfo> = null
/**  资源路径 */
export class AssemblerAssetInfo {
    private _path: string
    private _bundleName: string
    /**ab包名字 */
    get bundleName() {
        return this._bundleName
    }
    /**ab包下的相对路径 */
    get path() {
        return this._path
    }
    constructor(path: string = "") {
        this.init(path)
    }
    init(path: string = "") {
        const ary = path?.split(".") || []
        if (ary.length < 2) {//这是resources下的资源
            this._bundleName = ""
            this._path = ary[0] || ""
        } else {
            this._bundleName = ary[0] || ""
            this._path = ary[1] || ""
        }
        return this
    }
    /**回收自己 */
    recycle() {
        this.init()
        if (!cacheAssemblerInfos) cacheAssemblerInfos = ccArray<AssemblerAssetInfo>()
        cacheAssemblerInfos.pushCheck(this)
    }
    /**还原组装的路径 */
    toPath() {
        return this._bundleName + "." + this._path
    }
}

class CacheReleaseData {
    /**资源 */
    asset: cc.Asset
    /**路径信息 或者是 uuid */
    path: string
    /** lifeTarget最后一次释放的时间点（毫秒） 如果是0就会在AutoReleaseAsset  onDestroy的时候释放资源*/
    lastLoadTime: number
    releaseType: ReleaseType
    /**生命周期对象集 (资源可能被多个地方引用) */
    liftTargets: ccArrayType<AutoReleaseAsset>
    constructor(asset: cc.Asset, path: string, lastLoadTime: number, lifeTarget: cc.Node, releaseType: ReleaseType) {
        this.init(asset, path, lastLoadTime, lifeTarget, releaseType)
    }
    init(asset: cc.Asset, path: string, lastLoadTime: number, lifeTarget: cc.Node, releaseType: ReleaseType) {
        this.asset = asset
        this.path = path
        this.lastLoadTime = lastLoadTime
        this.releaseType = releaseType
        this.liftTargets = !this.liftTargets ? ccArray<AutoReleaseAsset>() : this.liftTargets
        const script = lifeTarget.getComponent(AutoReleaseAsset)
        this.liftTargets.pushCheck(script)
    }
    equals(asset: cc.Asset, path: string) {
        return this.asset === asset && this.path === path
    }
    reset(): void {
        this.asset = null
        this.path = ""
        this.releaseType = ReleaseType.AtOnce
        this.lastLoadTime = 0
        if (!this.liftTargets) this.liftTargets = ccArray<AutoReleaseAsset>()
        else this.liftTargets.length = 0
    }
}

const DELAY = 1
const logKey = false

/**
 * 加载性能统计数据
 */
export interface LoadStats {
    /** 总加载次数 */
    totalLoads: number;
    /** 成功加载次数 */
    successLoads: number;
    /** 失败加载次数 */
    failedLoads: number;
    /** 平均加载时间 (ms) */
    avgLoadTime: number;
    /** 最慢加载时间 (ms) */
    maxLoadTime: number;
    /** 最快加载时间 (ms) */
    minLoadTime: number;
    /** 总加载时间 (ms) */
    totalLoadTime: number;
    /** 重试次数 */
    retryCount: number;
    /** 批量加载次数 */
    batchLoads: number;
}

/**
 * 单次加载记录
 */
class LoadRecord {
    path: string;
    type: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    fromCache: boolean;
    retryCount: number;
    bundleName: string;
    assetSize: number; // 估算大小

    constructor(path: string, type: string, bundleName: string) {
        this.path = path;
        this.type = type;
        this.bundleName = bundleName;
        this.startTime = Date.now();
        this.endTime = 0;
        this.duration = 0;
        this.success = false;
        this.fromCache = false;
        this.retryCount = 0;
        this.assetSize = 0;
    }

    complete(success: boolean, fromCache: boolean, retryCount: number) {
        this.endTime = Date.now();
        this.duration = this.endTime - this.startTime;
        this.success = success;
        this.fromCache = fromCache;
        this.retryCount = retryCount;
    }
}

/**
 * 性能监控数据
 * 由于使用的是_delayCacheAssets等数据,是有可能是被释放的,所以缓存资源可能不准确
 */
class PerformanceMonitor {
    /** 加载记录历史 */
    private _loadRecords: LoadRecord[] = [];
    /** 最大记录数 */
    private _maxRecords = 1000;
    /** 统计数据 */
    private _stats: LoadStats = {
        totalLoads: 0,
        successLoads: 0,
        failedLoads: 0,
        avgLoadTime: 0,
        maxLoadTime: 0,
        minLoadTime: Number.MAX_SAFE_INTEGER,
        totalLoadTime: 0,
        retryCount: 0,
        batchLoads: 0
    };

    /**
     * 记录加载开始
     */
    startLoad(path: string, type: string, bundleName: string): LoadRecord {
        const record = new LoadRecord(path, type, bundleName);
        this._loadRecords.push(record);

        // 限制记录数量
        if (this._loadRecords.length > this._maxRecords) {
            this._loadRecords.shift();
        }

        return record;
    }

    /**
     * 记录加载完成
     */
    completeLoad(record: LoadRecord, success: boolean, retryCount: number, assetSize?: number) {
        record.complete(success, false, retryCount);
        if (assetSize !== undefined) {
            record.assetSize = assetSize;
        }

        // 更新统计
        this._stats.totalLoads++;
        if (success) {
            this._stats.successLoads++;
        } else {
            this._stats.failedLoads++;
        }

        this._stats.retryCount += retryCount;
        this._stats.totalLoadTime += record.duration;

        if (record.duration > this._stats.maxLoadTime) {
            this._stats.maxLoadTime = record.duration;
        }
        if (record.duration < this._stats.minLoadTime && record.duration > 0) {
            this._stats.minLoadTime = record.duration;
        }

        this._stats.avgLoadTime = this._stats.totalLoadTime / (this._stats.successLoads || 1);
    }

    /**
     * 记录批量加载
     */
    recordBatchLoad(count: number) {
        this._stats.batchLoads++;
    }

    /**
     * 获取统计数据
     */
    getStats(): LoadStats {
        return { ...this._stats };
    }

    /**
     * 获取慢加载记录 (超过指定时间的加载)
     */
    getSlowLoads(thresholdMs: number = 500): LoadRecord[] {
        return this._loadRecords.filter(r => r.duration > thresholdMs);
    }

    /**
     * 获取失败记录
     */
    getFailedLoads(): LoadRecord[] {
        return this._loadRecords.filter(r => !r.success);
    }

    /**
     * 获取最慢的 N 次加载
     */
    getSlowestLoads(count: number = 10): LoadRecord[] {
        return [...this._loadRecords]
            .filter(r => r.success)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, count);
    }

    /**
     * 清空统计数据
     */
    clear() {
        this._loadRecords.length = 0;
        this._stats = {
            totalLoads: 0,
            successLoads: 0,
            failedLoads: 0,
            avgLoadTime: 0,
            maxLoadTime: 0,
            minLoadTime: Number.MAX_SAFE_INTEGER,
            totalLoadTime: 0,
            retryCount: 0,
            batchLoads: 0
        };
    }

    /**
     * 打印性能报告
     */
    printReport() {
        const stats = this.getStats();
        clog.log("=".repeat(50));
        clog.log("📊 资源加载性能报告");
        clog.log("=".repeat(50));
        clog.log(`总加载次数：${stats.totalLoads}`);
        clog.log(`成功：${stats.successLoads} | 失败：${stats.failedLoads}`);
        clog.log(`成功率：${stats.totalLoads > 0 ? (stats.successLoads / stats.totalLoads * 100).toFixed(2) : 0}%`);
        clog.log(`平均加载时间：${stats.avgLoadTime.toFixed(2)}ms`);
        clog.log(`最快：${stats.minLoadTime === Number.MAX_SAFE_INTEGER ? 0 : stats.minLoadTime}ms | 最慢：${stats.maxLoadTime}ms`);
        clog.log(`总加载时间：${stats.totalLoadTime.toFixed(2)}ms`);
        clog.log(`重试次数：${stats.retryCount}`);
        clog.log(`批量加载：${stats.batchLoads}次`);
        clog.log("=".repeat(50));

        // 打印慢加载
        const slowLoads = this.getSlowLoads(500);
        if (slowLoads.length > 0) {
            clog.warn(`⚠️ 慢加载 (${slowLoads.length}个 > 500ms):`);
            slowLoads.slice(0, 5).forEach(record => {
                clog.warn(`  - ${record.path} (${record.duration.toFixed(2)}ms)`);
            });
        }

        // 打印失败
        const failed = this.getFailedLoads();
        if (failed.length > 0) {
            clog.error(`❌ 失败加载 (${failed.length}个):`);
            failed.slice(0, 5).forEach(record => {
                clog.error(`  - ${record.path}`);
            });
        }
    }
}
/**
 * 资源流程  :  先bundle---->获取资源
 */
@$gb.Identifiable
class LoadMgr_ {
    /////////////////////auto res
    /**延时释放的资源集 单独保存 */
    private _delayCacheAssets = ccArray<CacheReleaseData>()
    //永不释放的资源集 单独保存
    private _foreverCacheAssets = ccArray<CacheReleaseData>()
    /**立刻释放的资源集 */
    private _atOnceReleaseAssets = ccArray<CacheReleaseData>()
    /**缓存资源池 */
    private _cacheDataPool = ccArray<CacheReleaseData>()

    /**性能监控器 */
    private _perfMonitor = new PerformanceMonitor()

    /**全部重置*/
    reset() {
        // this._isInitDelayTag = true
        // this._delayCacheAssets.length = 0
        // this._foreverCacheAssets.length = 0
        // this._atOnceReleaseAssets.length = 0
        // this._cacheDataPool.length = 0
    }

    /**
     * 添加进入自动释放资源集
     * 如果是远端下载的资源
     * cc.assetManager.loadRemote(url, type, (err, asset) => {
     *     if (err) {
     *         clog.error("loadRes 没有获取到资源  url:" + url)
     *     }
     *     if (autoRelease && cc.isValid(lifeTarget, true) && asset) {
     *         const script = this._checkTargetComponent(lifeTarget)
     *         script.addReleaseAsset(url, asset, autoRelease ? 0 : Date.now())
     *     }
     *     onComplete?.(err, asset)
     *     resolve(asset as unknown as T)
     * })
     * @param path 
     * @param asset 
     * @param lifeTarget 最好是界面根节点,关闭的时候会检测
     * @returns 
     */
    addReleaseAsset(path: string, asset: cc.Asset, relaseType: ReleaseType, lifeTarget: cc.Node) {
        switch (relaseType) {
            case ReleaseType.AtOnce:
                this._addReleaseAsset(this._atOnceReleaseAssets, path, asset, relaseType, lifeTarget)
                break
            case ReleaseType.Forever:
                // targetAry = this._foreverCacheAssets
                //todo... 可扩展...
                break
            default:
                this._addReleaseAsset(this._delayCacheAssets, path, asset, relaseType, lifeTarget)
                $app.uiTool.schedule(Symbol("$loadMgr_delayRelease$"), () => {
                    for (let a = this._delayCacheAssets.length - 1; a >= 0; a--) {
                        const item = this._delayCacheAssets[a]
                        if (Date.now() - item.lastLoadTime < relaseType) continue
                        for (let p = item.liftTargets.length - 1; p >= 0; p--) {
                            const curLiftTarget = item.liftTargets[p]
                            if (!cc.isValid(curLiftTarget)) {
                                item.asset?.decRef()
                                if (!item.asset.refCount) {
                                    logKey && clog.warn("delayRelease 资源准备释放", "path: " + item.path, " recCount: " + item.asset.refCount)
                                    item.liftTargets.splice(p, 1)
                                }
                            }
                        }
                        if (item.liftTargets.isEmpty || item.liftTargets.checkCCValid()) {
                            logKey && clog.warn("完全释放", "path:" + item.path)
                            item.reset()
                            this._cacheDataPool.push(item)
                            this._delayCacheAssets.splice(a, 1)
                        }
                    }
                }, DELAY)
                break
        }
    }
    private _addReleaseAsset(targetAry: CacheReleaseData[], path: string, asset: cc.Asset, relaseType: ReleaseType, lifeTarget: cc.Node) {
        const fiterAry = targetAry.filter(item => item.equals(asset, path))
        var cache = fiterAry.shift()//按道理只有1个
        if (!cache) {
            cache = this._cacheDataPool.shift()
            const lastLoadTime = relaseType == ReleaseType.AtOnce ? 0 : Infinity
            if (!cache) {
                cache = new CacheReleaseData(asset, path, lastLoadTime, lifeTarget, relaseType)
                cache.asset.addRef()
            } else {
                !cache.liftTargets.some(target => target.node === lifeTarget) && asset.addRef()
                cache.init(asset, path, lastLoadTime, lifeTarget, relaseType)
            }
            targetAry.push(cache)
        } else {
            const script = lifeTarget.getComponentOrAdd(AutoReleaseAsset)
            if (cache.liftTargets.pushCheck(script) && relaseType != ReleaseType.AtOnce) {//及时移除的资源不能addRef
                cache.lastLoadTime = Infinity
                asset.addRef()
            }
        }
    }
    private _getLiftTargetName(lifeTarget: cc.Node | cc.Component) {
        if (lifeTarget instanceof cc.Component) {
            return lifeTarget.node.name
        }
        return lifeTarget.name
    }
    /**
     * 检测立刻释放的 所有liftTarget相关的资源
     * @param lifeTarget 
     */
    checkAtOnceReleaseAssets(lifeTarget: AutoReleaseAsset) {
        let assetAry = this._atOnceReleaseAssets.filter(item => item.liftTargets.some(target => target === lifeTarget))
        logKey && clog.warn("lifeTarget onDestroy ,ready clear asset , name:" + this._getLiftTargetName(lifeTarget))
        assetAry.forEach(item => {
            if (item.asset) {
                item.asset.decRef()
                !item.asset.refCount && item.liftTargets.deleteElement(lifeTarget)
                logKey && clog.warn("资源准备释放", "path:" + item.path, " recCount:" + item.asset.refCount)
                if (item.liftTargets.isEmpty || item.liftTargets.checkCCValid()) {
                    logKey && clog.warn("完全释放", "path:" + item.path)
                    item.reset()
                    this._cacheDataPool.push(item)
                    this._atOnceReleaseAssets.deleteElement(item)
                }
            }
        })
        //延迟的数据
        assetAry = this._delayCacheAssets.filter(item => item.liftTargets.some(target => target === lifeTarget))
        assetAry.forEach(item => {
            item.lastLoadTime = Date.now()//更新时间
        })
    }
    /**
     * liftTarget释放单个asset资源
     */
    releaseAsset(asset: cc.Asset, lifeTarget: AutoReleaseAsset | cc.Node | cc.Component) {
        const target = lifeTarget instanceof AutoReleaseAsset ? lifeTarget : lifeTarget?.getComponent(AutoReleaseAsset)
        if (!asset || !lifeTarget || !target) return
        const ary = this._atOnceReleaseAssets.filter(item => item.asset === asset && item.liftTargets.includes(target))
        //按道理只有一个
        const item = ary.shift()
        if (asset === item.asset) {
            item.liftTargets.deleteElement(target)
            item.asset?.decRef?.()
            logKey && clog.warn("资源准备释放", "path:" + item.path, " recCount:" + item.asset.refCount)
            if (item.liftTargets.isEmpty || item.liftTargets.checkCCValid()) {
                item.reset()
                this._cacheDataPool.push(item)
            }
        }
    }
    /**
     * 当lifeTarget无效时  调用此函数  立刻检测释放AtOnce类型的资源
     * @param asset 
     */
    private _noValidLiftTargetRelease(asset: cc.Asset, path: string, relaseType: ReleaseType) {
        //为了减少遍历 刚创建出来 直接decRef
        if (relaseType == ReleaseType.AtOnce && asset.refCount < 1) {
            logKey && clog.warn("asset的target已经被销毁, 准备释放asset资源", "path = " + path, " recCount:" + asset?.refCount)
            asset?.decRef?.()
        }
    }
    /////////////////////auto res

    /**
     * 获取加载过的bundle  
     * @param bunledName 
     * @returns 
     */
    getBundle(bunledName: string) {
        if (!bunledName) {
            return cc.assetManager.resources
        }
        return cc.assetManager.getBundle(bunledName)
    }
    /**
     * 检查是否加载
     * @param bunledName 
     * @returns 
     */
    async checkBundle(bunledName: string, onComplete?: onBundleFun) {
        let bundle = this.getBundle(bunledName)
        if (!bundle) {
            bundle = await this.loadBundle(bunledName, onComplete)
        } else {
            onComplete?.(null, bundle)
        }
        return bundle
    }
    /**
     * 加载bundle 
     * @param bundle 
     * @param bundleName 
     * @returns 
     */
    loadBundle(bundleName: string, onComplete?: onBundleFun) {
        $app.miniLoadTask?.pause()
        return new Promise<cc.AssetManager.Bundle>((reslove, reject) => {
            cc.assetManager.loadBundle(bundleName, (err: Error, bundleRes: cc.AssetManager.Bundle) => {
                if (err) {
                    clog.error("loadBundle 没有获取到ab包  bundleName:" + bundleName)
                }
                $app.miniLoadTask?.resume()
                onComplete?.(err, bundleRes)
                reslove(bundleRes)
            })
        })
    }
    /**
     * 获取bundle下的path中所有资源 如果提供了type 就只获取type类型的资源   
     * loadDir 不指定类型后资源的引用计数为 1，且需要我们手动管理     
     * 指定了类型引用为0
     * @param path 
     * @param type 
     * @param onProgress 
     * @returns 注意当加载时候,target已经销毁的情况下,资源可能会被释放
     */
    async loadDir<T extends typeof cc.Asset>(path: string, lifeTarget?: cc.Node | cc.Component, type?: T, relaseType?: ReleaseType, onProgress?: onProgressFun, onCompleteFun?: onCompleteFun): Promise<T[]> {
        const parseData = this.assemblerResInfo(path)
        const bundle = await this.checkBundle(parseData.bundleName)
        relaseType = relaseType ?? ReleaseType.AtOnce
        $app.miniLoadTask?.pause()
        return new Promise((resolve) => {
            bundle?.loadDir(parseData.path, type,
                //进度条
                (finish: number, total: number, item: cc.AssetManager.RequestItem) => {
                    onProgress?.(finish, total, item)
                },
                //完成函数
                async (error: Error, assets: cc.Asset[]) => {
                    if (error) {
                        clog.error("loadDir 没有获取到资源  path:" + path)
                    }
                    const dirInfo = bundle.getDirWithPath(parseData.path, type)
                    const isValid = cc.isValid(lifeTarget, true)
                    assets?.forEach((item, idx) => {
                        const pathInfo = dirInfo[idx]
                        const assetPath = parseData.bundleName + "." + pathInfo.path
                        if (isValid) {
                            const script = lifeTarget.getComponentOrAdd(AutoReleaseAsset)
                            script.addReleaseAsset(assetPath, item, relaseType)
                        } else if (relaseType != ReleaseType.Forever) {
                            this._noValidLiftTargetRelease(item, parseData.bundleName + "." + pathInfo.path, relaseType)
                        }
                    })
                    parseData.recycle()
                    $app.miniLoadTask?.resume()
                    onCompleteFun?.(error, assets)
                    resolve(assets as unknown as T[])
                })
        })
    }
    /**
     * 提前预加载path目录中的资源
     * @param path 
     * @param type 
     * @param onProgress 
     * @param onCompleteFun 
     * @returns 
     */
    async preloadDir<T extends typeof cc.Asset>(path: string, type?: T, onProgress?: onProgressFun, onCompleteFun?: onCompleteFun) {
        const pathInfo = this.assemblerResInfo(path)
        const bundle = await this.checkBundle(pathInfo.bundleName)
        $app.miniLoadTask?.pause()
        return new Promise<cc.AssetManager.RequestItem[]>((resolve) => {
            bundle?.preloadDir(path, type,
                //进度条
                (finish: number, total: number, item: cc.AssetManager.RequestItem) => {
                    onProgress?.(finish, total, item)
                },
                //完成函数
                (error: Error, asset: cc.AssetManager.RequestItem[]) => {
                    if (error) {
                        clog.error("preloadDir 没有获取到资源  path:" + path)
                    }
                    pathInfo.recycle()
                    $app.miniLoadTask?.resume()
                    onCompleteFun?.(error, asset)
                    resolve(asset)
                })
        })
    }

    /**
     * 通用  资源加载
     * @param path bundle.xx/xx  如果不加 bundle的名字 就是获取resources下的资源
     * @param type 类型
     * @param lifeTarget 生命周期对象 如果=null,将不会自动释放资源
     * @param onProgress 
     * @param ReleaseType 释放时机
     * @param onCompleted 
     * @returns 注意当加载时候,target已经销毁的情况下,资源可能会被释放
     */
    /**
     * 获取资源（泛型版本）
     * @param path 资源路径
     * @param type 资源类型
     * @param lifeTarget 生命周期绑定对象
     * @param relaseType 资源释放类型
     * @param retryCount 失败重试次数，默认 0（不重试）
     * @param onProgress 进度回调
     * @param onCompleted 完成回调
     * @returns 资源实例
     */
    async getRes<T extends typeof cc.Asset>(path: string, type: T, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<InstanceType<T>>
    async getRes(path: string, type: typeof cc.Prefab, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.Prefab>
    async getRes(path: string, type: typeof cc.SpriteFrame, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.SpriteFrame>
    async getRes(path: string, type: typeof cc.Texture2D, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.Texture2D>
    async getRes(path: string, type: typeof cc.SpriteAtlas, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.SpriteAtlas>
    async getRes(path: string, type: typeof cc.AudioClip, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.AudioClip>
    async getRes(path: string, type: typeof cc.JsonAsset, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.JsonAsset>
    async getRes(path: string, type: typeof cc.TTFFont, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.TTFFont>
    async getRes(path: string, type: typeof cc.TextAsset, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.TextAsset>
    async getRes(path: string, type: typeof sp.SkeletonData, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<sp.SkeletonData>
    async getRes(path: string, type: typeof cc.LabelAtlas, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun): Promise<cc.LabelAtlas>
    async getRes(path: string, type: typeof cc.Asset, lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, retryCount?: number, onProgress?: onProgressFun, onCompleted?: onCompleteFun) {
        const pathInfo = this.assemblerResInfo(path)
        const bundle = await this.checkBundle(pathInfo.bundleName, null)
        if (!bundle) {
            clog.error("没有找到资源的 bundle  path:" + path)
            pathInfo.recycle()
            return null
        }

        // 性能监控：开始
        const loadRecord = this._perfMonitor.startLoad(path, type.name, pathInfo.bundleName)

        relaseType = relaseType ?? ReleaseType.AtOnce
        retryCount = retryCount ?? 0
        const res = bundle.get(pathInfo.path, type)

        if (res) {
            // 缓存命中
            if (cc.isValid(lifeTarget, true)) {
                const script = lifeTarget.getComponentOrAdd(AutoReleaseAsset)
                script.addReleaseAsset(path, res, relaseType)
            } else if (relaseType != ReleaseType.Forever) {
                this._noValidLiftTargetRelease(res, path, relaseType)
            }
            pathInfo.recycle()

            // 性能监控：完成
            loadRecord.complete(true, false, 0)
            this._perfMonitor.completeLoad(loadRecord, true, 0)

            return Promise.resolve(res)//任然异步返回    
        }

        // 缓存未命中，需要加载
        const result = await this._loadRes(bundle, pathInfo, type, lifeTarget, relaseType, retryCount, onProgress, onCompleted)

        // 性能监控：完成
        const success = result !== null
        this._perfMonitor.completeLoad(loadRecord, success, retryCount)

        return result
    }
    /**
   * 获取资源  所有类型的通用接口
   * @param bundle 包
   * @param path 相对 bundle 的资源路径
   * @param type 加载类型
   * @param retryCount 失败重试次数，默认 0（不重试）
   * @param onProgress 进度函数
   * @returns 
   */
    private async _loadRes<T extends typeof cc.Asset>(bundle: string, pathInfo: AssemblerAssetInfo, type: T, lifeTarget: cc.Node | cc.Component, relaseType: ReleaseType, retryCount: number, onProgress: onProgressFun, onComplete: onCompleteFun): Promise<T>
    private async _loadRes<T extends typeof cc.Asset>(bundle: cc.AssetManager.Bundle, pathInfo: AssemblerAssetInfo, type: T, lifeTarget: cc.Node | cc.Component, relaseType: ReleaseType, retryCount: number, onProgress: onProgressFun, onComplete: onCompleteFun): Promise<T>
    private async _loadRes<T extends typeof cc.Asset>(bundle: cc.AssetManager.Bundle | string, pathInfo: AssemblerAssetInfo, type: T, lifeTarget: cc.Node | cc.Component, relaseType: ReleaseType, retryCount: number, onProgress: onProgressFun, onComplete: onCompleteFun): Promise<T> {
        let curBundle: cc.AssetManager.Bundle
        if (!(bundle instanceof cc.AssetManager.Bundle)) {
            curBundle = await this.checkBundle(bundle) as cc.AssetManager.Bundle
        } else curBundle = bundle

        // 重试逻辑
        let lastError: Error = null
        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                const result = await this._loadResAttempt(curBundle, pathInfo, type, lifeTarget, relaseType, onProgress, onComplete)
                return result
            } catch (error) {
                lastError = error
                if (attempt < retryCount) {
                    clog.warn(`_loadRes 加载失败，第 ${attempt + 1}/${retryCount} 次重试 path:${pathInfo.path}`)
                }
            }
        }

        // 所有重试都失败
        clog.error(`_loadRes 加载失败，已重试${retryCount}次 path:${pathInfo.path}`)
        onComplete?.(lastError, null)
        return null
    }

    /**
     * 单次加载尝试
     */
    private async _loadResAttempt<T extends typeof cc.Asset>(bundle: cc.AssetManager.Bundle, pathInfo: AssemblerAssetInfo, type: T, lifeTarget: cc.Node | cc.Component, relaseType: ReleaseType, onProgress: onProgressFun, onComplete: onCompleteFun): Promise<T> {
        $app.miniLoadTask?.pause()
        return new Promise((resolve, reject) => {
            bundle?.load(pathInfo.path, type,
                //进度条
                (finish: number, total: number, item: cc.AssetManager.RequestItem) => {
                    onProgress?.(finish, total, item)
                },
                //完成函数
                (error: Error, asset: InstanceType<T>) => {
                    if (error) {
                        clog.error("_loadResAttempt  没有获取到资源  path:" + pathInfo.path)
                        pathInfo.recycle()
                        $app.miniLoadTask?.resume()
                        onComplete?.(error, null)
                        reject(error)
                        return
                    }
                    if (asset) {
                        if (cc.isValid(lifeTarget, true)) {
                            const script = lifeTarget.getComponentOrAdd(AutoReleaseAsset)
                            script.addReleaseAsset(pathInfo.toPath(), asset, relaseType)
                        } else if (relaseType != ReleaseType.Forever) {
                            this._noValidLiftTargetRelease(asset, pathInfo.toPath(), relaseType)
                        }
                    }
                    pathInfo.recycle()
                    $app.miniLoadTask?.resume()
                    onComplete?.(error, asset)
                    resolve(asset as unknown as T)
                })
        })
    }
    /**
     * 批量加载资源
     * @param paths 资源路径数组
     * @param type 资源类型
     * @param lifeTarget 生命周期绑定对象
     * @param relaseType 资源释放类型
     * @param retryCount 失败重试次数，默认 0（不重试）
     * @param onProgress 进度回调 (当前索引，总数量，单个资源结果)
     * @param onCompleted 完成回调 (错误数组，资源数组)
     * @returns 资源数组
     * 
     * @example
     * ```typescript
     * // 批量加载多个预制体
     * const prefabs = await $app.load.getResBatch(
     *     ["prefab/MainView", "prefab/ShowView", "prefab/Toast"],
     *     cc.Prefab,
     *     this.node,
     *     ReleaseType.AtOnce,
     *     0,
     *     (index, total, result) => {
     *         console.log(`加载进度：${index + 1}/${total}`);
     *     }
     * );
     * 
     * // 批量加载多个 SpriteFrame
     * const spriteFrames = await $app.load.getResBatch(
     *     ["textures/icon1", "textures/icon2", "textures/icon3"],
     *     cc.SpriteFrame,
     *     this.node,
     *     ReleaseType.DelayTwo,
     *     3 // 失败重试 3 次
     * );
     * ```
     */
    async getResBatch<T extends typeof cc.Asset>(
        paths: string[],
        type: T,
        lifeTarget: cc.Node | cc.Component,
        relaseType?: ReleaseType,
        retryCount?: number,
        onProgress?: (index: number, total: number, result: InstanceType<T>) => void,
        onCompleted?: (errors: Error[], assets: InstanceType<T>[]) => void
    ): Promise<InstanceType<T>[]> {
        if (!paths || paths.length === 0) {
            onCompleted?.([], [])
            return []
        }

        relaseType = relaseType ?? ReleaseType.AtOnce
        retryCount = retryCount ?? 0

        // 性能监控：记录批量加载
        this._perfMonitor.recordBatchLoad(paths.length)

        const results: InstanceType<T>[] = []
        const errors: Error[] = []
        const total = paths.length

        // 并行加载所有资源
        const loadPromises = paths.map(async (path, index) => {
            try {
                const result = await this.getRes(path, type, lifeTarget, relaseType, retryCount)
                results[index] = result
                onProgress?.(index, total, result)
                if (!result) {
                    errors[index] = new Error(`加载失败：${path}`)
                }
            } catch (error) {
                errors[index] = error
                results[index] = null
            }
        })

        await Promise.all(loadPromises)
        onCompleted?.(errors, results)
        return results
    }

    /**
     * 批量加载不同类型的资源
     * @param tasks 加载任务数组，每个任务包含路径、类型
     * @param lifeTarget 生命周期绑定对象
     * @param relaseType 资源释放类型
     * @param retryCount 失败重试次数，默认 0（不重试）
     * @param onProgress 进度回调
     * @param onCompleted 完成回调
     * @returns 资源数组（按任务顺序）
     * 
     * @example
     * ```typescript
     * // 批量加载不同类型的资源
     * const tasks = [
     *     { path: "prefab/MainView", type: cc.Prefab },
     *     { path: "textures/background", type: cc.SpriteFrame },
     *     { path: "audio/bgm", type: cc.AudioClip }
     * ]
     * 
     * const results = await $app.load.getResBatchMixed(
     *     tasks,
     *     this.node,
     *     ReleaseType.AtOnce,
     *     0,
     *     (index, total) => {
     *         console.log(`加载进度：${index + 1}/${total}`);
     *     }
     * );
     * 
     * // results[0] 是 Prefab, results[1] 是 SpriteFrame, results[2] 是 AudioClip
     * ```
     */
    async getResBatchMixed(
        tasks: Array<{ path: string, type: typeof cc.Asset }>,
        lifeTarget: cc.Node | cc.Component,
        relaseType?: ReleaseType,
        retryCount?: number,
        onProgress?: (index: number, total: number) => void,
        onCompleted?: (errors: Error[], assets: any[]) => void
    ): Promise<any[]> {
        if (!tasks || tasks.length === 0) {
            onCompleted?.([], [])
            return []
        }

        relaseType = relaseType ?? ReleaseType.AtOnce
        retryCount = retryCount ?? 0

        const results: any[] = []
        const errors: Error[] = []
        const total = tasks.length

        // 并行加载所有资源
        const loadPromises = tasks.map(async (task, index) => {
            try {
                const result = await this.getRes(task.path, task.type, lifeTarget, relaseType, retryCount)
                results[index] = result
                onProgress?.(index, total)
                if (!result) {
                    errors[index] = new Error(`加载失败：${task.path}`)
                }
            } catch (error) {
                errors[index] = error
                results[index] = null
            }
        })

        await Promise.all(loadPromises)
        onCompleted?.(errors, results)
        return results
    }

    /**
     * 加载远程spine资源
     * @param url 远程资源路径，不包含文件名和扩展名
     * @param resName 
     * @param ext 
     * @param textureNames 
     * @param lifeTarget 
     * @param relaseType 
     * @param onCompleted 
     * @returns 
     */
    async loadRemoteSpine(url: string, resName: string, ext: ".skel" | ".json", textureNames: string[], lifeTarget: cc.Node | cc.Component, relaseType?: ReleaseType, onCompleted?: onCompleteFun): Promise<sp.SkeletonData> {
        url = url.endsWith("/") ? url : url + "/"

        // 性能监控：开始
        const loadRecord = this._perfMonitor.startLoad(url + resName, "sp.SkeletonData", "remote")

        return new Promise((resolve) => {
            cc.assetManager.loadAny([
                { url: url + resName + ".atlas", ext: ".atlas" },
                { url: url + resName + ext, ext }
            ], (err, assetAry: any[]) => {
                if (err) {
                    clog.error("load remote spine error:", err, " path:" + url + resName)

                    // 性能监控：失败
                    this._perfMonitor.completeLoad(loadRecord, false, 0)

                    resolve(null)
                    return
                }
                const spData = new sp.SkeletonData()
                spData[ext === ".json" ? ".json" : "_nativeAsset"] = assetAry[1]
                spData.textures = []
                spData.atlasText = assetAry[0]
                spData["_uuid"] = url + resName
                spData["textureNames"] = textureNames

                // 记录纹理加载进度
                let loadedTextureCount = 0
                const totalTextures = textureNames.length
                let hasError = false

                for (let a = 0; a < totalTextures; a++) {
                    const urlName = url + textureNames[a]
                    cc.assetManager.loadRemote(urlName, (err, imgAsset: cc.Texture2D) => {
                        if (err) {
                            clog.error("load spine img error:", err, " path:", url + textureNames[a])

                            // 性能监控：失败（只记录一次）
                            if (!hasError) {
                                hasError = true
                                this._perfMonitor.completeLoad(loadRecord, false, 0)
                            }

                            resolve(null)
                            return
                        }
                        if (cc.isValid(lifeTarget, true)) {
                            const script = lifeTarget.getComponentOrAdd(AutoReleaseAsset)
                            script.addReleaseAsset(urlName, imgAsset, relaseType)
                        } else if (relaseType != ReleaseType.Forever) {
                            this._noValidLiftTargetRelease(imgAsset, urlName, relaseType)
                        }
                        spData.textures.push(imgAsset)

                        // 所有纹理加载完成
                        if (++loadedTextureCount === totalTextures) {
                            // 性能监控：成功
                            this._perfMonitor.completeLoad(loadRecord, true, 0)

                            onCompleted?.(err, spData)
                            resolve(spData)
                        }
                    })
                }
            })
        })
    }
    /**
     * 通过path构建资源信息
     * 如果不加 bundle的名字 就是获取resources下的资源
     * @param param 可以是 bundle.xx/xx 或者 bundle 的名字
     * @param relativePath bundle下的相对路径
     * @returns 
     */
    assemblerResInfo(param: string)
    assemblerResInfo(param: string, relativePath?: string) {
        let info = cacheAssemblerInfos?.shift()
        if (!info) {
            info = new AssemblerAssetInfo()
        }
        if (param.includes(".") && !relativePath) {
            return info.init(param)
        }
        else if (!param.includes(".") && relativePath) {
            return info.init(param + "." + relativePath)
        }
        else if (!param.includes(".")) {//resources下资源
            return info.init(cc.AssetManager.BuiltinBundleName.RESOURCES + "." + param)
        }
        return null
    }

    // ==================== 性能监控公开方法 ====================

    /**
     * 获取加载性能统计数据
     * @returns 性能统计数据
     * 
     * @example
     * ```typescript
     * const stats = $app.load.getLoadStats();
     * console.log(`总加载次数：${stats.totalLoads}`);
     * console.log(`平均加载时间：${stats.avgLoadTime.toFixed(2)}ms`);
     * ```
     */
    getLoadStats(): LoadStats {
        return this._perfMonitor.getStats();
    }

    /**
     * 打印性能报告到控制台
     * 
     * @example
     * ```typescript
     * // 在调试界面打印性能报告
     * $app.load.printLoadReport();
     * ```
     */
    printLoadReport() {
        this._perfMonitor.printReport();
    }

    /**
     * 获取慢加载记录
     * @param thresholdMs 时间阈值 (毫秒)，默认 500ms
     * @returns 慢加载记录数组
     * 
     * @example
     * ```typescript
     * const slowLoads = $app.load.getSlowLoads(1000);
     * slowLoads.forEach(record => {
     *     console.log(`${record.path}: ${record.duration}ms`);
     * });
     * ```
     */
    getSlowLoads(thresholdMs: number = 500): LoadRecord[] {
        return this._perfMonitor.getSlowLoads(thresholdMs);
    }

    /**
     * 获取失败记录
     * @returns 失败记录数组
     * 
     * @example
     * ```typescript
     * const failedLoads = $app.load.getFailedLoads();
     * failedLoads.forEach(record => {
     *     console.error(`失败：${record.path}`);
     * });
     * ```
     */
    getFailedLoads(): LoadRecord[] {
        return this._perfMonitor.getFailedLoads();
    }

    /**
     * 获取最慢的 N 次加载
     * @param count 数量，默认 10
     * @returns 最慢的加载记录
     * 
     * @example
     * ```typescript
     * const top10 = $app.load.getTopSlowestLoads(10);
     * console.log("最慢的 10 次加载:");
     * top10.forEach((record, i) => {
     *     console.log(`${i + 1}. ${record.path}: ${record.duration}ms`);
     * });
     * ```
     */
    getTopSlowestLoads(count: number = 10): LoadRecord[] {
        return this._perfMonitor.getSlowestLoads(count);
    }

    /**
     * 清空性能统计数据
     * 
     * @example
     * ```typescript
     * // 每局游戏结束后清空统计
     * $app.load.clearLoadStats();
     * ```
     */
    clearLoadStats() {
        this._perfMonitor.clear();
    }
}

export const LoadMgr = $gb.SingletonProxy(LoadMgr_)

$gb.registerApp("load", LoadMgr)

