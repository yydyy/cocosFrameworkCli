// @FilePath: BaseId.ts

/*
 * @Author: yyd
 * @Date: 2025-04-11 21:04:37
 * @LastEditTime: 2026-01-01 20:16:20
 * @FilePath: \cocosTools\assets\Script\Extend\Base\Base.ts
 * @Description:  唯一id 生成器
 */

let onlyId = 1
export function getOnlyId() {
    return onlyId++
}
