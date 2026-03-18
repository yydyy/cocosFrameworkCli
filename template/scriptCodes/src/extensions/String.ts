// @FilePath: String.ts
/*
 * @Author: yyd
 * @Date: 2023-04-28 09:54:45
 * @LastEditTime: 2025-07-12 08:58:39
 * @FilePath: \cocostools\cocosTools\assets\Script\Extend\String.ts
 * @Description:  扩展 string
 */

declare global {
    interface String {
        /**
        * 格式化字符串 %[sdf]
        * @示例：
        * "%d上学了".format("小金鱼")   @打印:
        *  小金鱼上学了
        */
        format: (...args: any[]) => string;
        /**
         * 将string转换为number  得确认是数字才能转换
         * @returns 
         */
        toNumber: () => number
        /**
         * 将字符串按照splitName的名字转换为数组
         * @param splitName 分割符
         * @param isTransNumber 是否都转换为number[]
         * @returns 
         */
        toAry: (splitName: string, isTransNumber: boolean) => string[] | number[]

        /**
         * 直接只用字符串克隆出节点   
         * @param parent 
         * @param name 
         */
        clonePrefab: (lifeTarget?: any, parent?: any, name?: string) => Promise<any>
        /**
         * 通过字符串克隆并返回用户自定义的脚本
         * @param type 
         * @param parent 
         * @param name 
         */
        clonePrefabScript<T>(type: { new(): T }, lifeTarget?: any, parent?: any, name?: string): Promise<T>
        /**
         * 最后一个字符
         * @returns 
         */
        lastChar: () => string
    }
}

if (!String.prototype.lastChar) {
    String.prototype.lastChar = function () {
        return this.charAt(this.length - 1)
    }
}

if (!String.prototype.clonePrefab) {
    String.prototype.clonePrefab = async function (lifeTarget?: any, parent?: any, name?: string) {
        const prefabNode = await $app.load.getRes(this, cc.Prefab, lifeTarget)
        if (!prefabNode) return null
        const node = cc.instantiate(prefabNode)
        name && (node.name = name)
        cc.isValid(parent, true) && (node.parent = parent instanceof cc.Component ? parent.node : parent)
        return node
    }
}

if (!String.prototype.clonePrefabScript) {
    String.prototype.clonePrefabScript = async function <T>(type: { new(): T }, lifeTarget?: any, parent?: any, name?: string) {
        const node = await this.clonePrefab(lifeTarget, parent, name)
        const script = node?.getComponent(type)
        return script
    }
}

if (!String.prototype.format) {
    String.prototype.format = function (...args: any[]) {
        let index = 0;
        return this.replace(/%[dfs]/g, function (str: string) {
            let s = args[index++];
            return !$app.tool.isUn(s) ? s : str;
        });
    };
}

if (!String.prototype.toNumber) {
    String.prototype.toNumber = function () {
        return Number(this)
    }
}

if (!String.prototype.toAry) {
    String.prototype.toAry = function (splitName: string, isTransNumber: boolean = false) {
        if (isTransNumber) {
            return this.split(splitName).map(v => Number(v)) as number[]
        }
        return this.split(splitName) as string[]
    }
}

export {};
