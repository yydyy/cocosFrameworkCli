// @FilePath: PoolMgr.ts
/*
 * @Author: yyd
 * @Date: 2024-04-07 16:47:16
 * @LastEditTime: 2026-01-01 17:32:51
 * @FilePath: \cocosTools\assets\Script\Extend\mgr\PoolMgr.ts
 * @Description:  节点缓存池 使用缓存池过程中就不能随意更改target的名字
 *    不推荐在itemBase中使用,最好在View中
 */

type POOLS = { [key in string]: ccArrayType<cc.Node> }
type POOLS_TYPE = { pools: POOLS, isRegist: boolean }
const MAX_POOL_SIZE = 200
type TYPE = cc.Component

@$gb.Identifiable
class PoolsMgr_ {
    private _pools: Map<BaseType, POOLS_TYPE> = new Map();

    /**
     * 清理
     * @param excludes 排除
     */
    clear(excludes?: string[]) {
        try {
            if (!excludes) {
                // 销毁所有节点并清空
                this._pools.forEach(poolType => {
                    Object.values(poolType.pools).forEach(nodes => {
                        nodes.forEach(node => node.isValid && node.destroy())
                    });
                });
                this._pools.clear()
                return;
            }
            // 清理非排除池
            this._pools.forEach(poolType => {
                const { pools } = poolType;
                Object.keys(pools).forEach(k => {
                    if (!excludes.includes(k)) {
                        pools[k].forEach(node => node.isValid && node.destroy())
                        pools[k].length = 0
                    }
                });
            });
        } catch (error) {
            clog.error("pool mgr", "清理缓存池失败", error)
        }
    }

    /**
     * 摧毁target的时候,销毁池子
     * @param obj 
     * @param target 
     */
    private _hookOnDestory<T extends TYPE>(target: T) {
        let obj = this._pools.get(target.uuid)
        obj = obj ?? { isRegist: false, pools: {} } as POOLS_TYPE
        this._pools.set(target.uuid, obj)
        if (!obj.isRegist) {
            gRegisterClass.registerDestroyHook(target, (...args) => {
                clog.view("poolMgr销毁 %s 的缓存池".format(target.name))
                Object.values(obj.pools).forEach(ary => {
                    ary.forEach(n => n.isValid && n.destroy());
                });
                this._pools.delete(target.uuid)
            })
            obj.isRegist = true
        }
        return obj
    }

    /**
     * 获取
     * @param key 
     * @param target 
     * @returns 
     */
    use<T extends TYPE>(key: string, target: T): cc.Node | null {
        if (!target?.isValid) return null
        let obj = this._hookOnDestory(target)
        let pool = obj.pools
        return pool[key]?.shift() || null
    }
    /**
       * 判断缓存池中是否有了该key的对象
       * @param key 
       * @param target 
       */
    checkHadTarget<T extends TYPE>(key: string, target: T) {
        const obj = this._hookOnDestory(target)
        const pool = obj.pools
        return pool?.[key] && !!pool[key].length
    }
    /**
     * 压入     会执行以下代码                                                                     
     * cc.Tween.stopAllByTarget(node)                                                                                                       
     * node.removeFromParent(false)                                                                                 
     * @param key 
     * @param target 
     */
    recycle<T extends TYPE>(key: string, node: cc.Node, target: T) {
        try {
            if (!node?.isValid) return
            const obj = this._hookOnDestory(target)
            const pool = obj.pools
            const ary = pool[key] = pool[key] ?? ccArray<cc.Node>()
            cc.Tween.stopAllByTarget(node)
            node.parent = null
            //不能重复加入
            if (ary.length >= MAX_POOL_SIZE) {
                clog.warn("pool mgr", "缓存池 %s 已满, 不能再加入".format(key))
                node.isValid && node.destroy()
                return
            }
            ary.pushCheck(node)
        } catch (error) {
            clog.error("pool mgr", "回收节点失败", error)
            node.isValid && node.destroy()
        }
    }
}

export const PoolsMgr = $gb.SingleFunc(PoolsMgr_)
