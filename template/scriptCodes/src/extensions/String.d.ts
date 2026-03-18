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
        toNumber: () => number;
        /**
         * 将字符串按照splitName的名字转换为数组
         * @param splitName 分割符
         * @param isTransNumber 是否都转换为number[]
         * @returns
         */
        toAry: (splitName: string, isTransNumber: boolean) => string[] | number[];
        /**
         * 直接只用字符串克隆出节点
         * @param parent
         * @param name
         */
        clonePrefab: (lifeTarget?: any, parent?: any, name?: string) => Promise<any>;
        /**
         * 通过字符串克隆并返回用户自定义的脚本
         * @param type
         * @param parent
         * @param name
         */
        clonePrefabScript<T>(type: {
            new (): T;
        }, lifeTarget?: any, parent?: any, name?: string): Promise<T>;
        /**
         * 最后一个字符
         * @returns
         */
        lastChar: () => string;
    }
}
export {};
