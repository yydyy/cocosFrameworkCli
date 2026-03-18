// @FilePath: types/ReleaseType.ts
/*
 * @Author: yyd
 * @Description: 资源释放类型枚举
 */

/**
 * 资源释放类型  可以自定义扩展延迟时间长久类型
 */
export enum ReleaseType {
    /**lifeTarget destroy后 立即释放 */
    AtOnce = 0,
    /**lifeTarget destroy后  延迟 xx 毫秒后释放 */
    DelayTwo = 10 * 1000,  //30s
    /**永不释放*/
    Forever = Number.MAX_SAFE_INTEGER,
}
