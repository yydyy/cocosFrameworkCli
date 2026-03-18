/**
 * 增强数组类，不污染全局 Array.prototype
 * @example
 * const arr = ccArray(1, 2, 3);       // 工厂函数创建
 * const arr2 = ccArray<number>(10);   // 指定长度
 * const arr3 = ccArray.from([1,2,3]); // 从普通数组转换
 */
export declare class _ccArray<T> extends Array<T> {
    /**
     * 构造函数 - 正确处理 Array 继承
     */
    constructor(...items: T[]);
    /**
     * 获取第一个元素
     */
    get firstOne(): T | undefined;
    /**
     * 获取最后一个元素
     * @returns
     */
    get lastOne(): T | undefined;
    /**
     * 判断数组是否为空
     * @returns
     */
    get isEmpty(): boolean;
    /**
     * 倒序遍历
     * @param callback
     * @returns
     */
    reverseForEach(callback: (value: T, index: number, arr: T[]) => void | boolean): this;
    /**
     * 检查并添加元素
     * @param ele 元素
     * @returns
     */
    pushCheck(ele: T): boolean;
    /**
     * 检查数组中的元素是否有效
     * @returns
     */
    checkCCValid(): boolean;
    /**
     * 获取元素的个数
     * @param value 元素
     * @returns
     */
    valueCount(value: T): number;
    /**
     * 重复添加元素
     * @param ele 元素
     * @param count 重复次数
     * @returns
     */
    repeatPush(ele: T, count?: number): this;
    /**
     * 删除元素
     * @param ele 元素
     * @param deleteNum 删除次数
     * @returns
     */
    deleteElement(ele: T | T[], deleteNum?: number): this;
    /**
     * 判断两个数组是否相等
     * @param arr 数组
     * @param compareType 比较类型
     * @param ignoreOrder 是否忽略顺序
     * @param exAry 排除的元素
     * @returns
     */
    isEqual(arr: T[], compareType?: "reference" | "shallow" | "deep", ignoreOrder?: boolean, exAry?: T | T[]): boolean;
    /**
     * 从 ArrayLike 或 Iterable 创建增强数组
     * @param arrayLike 类数组或可迭代对象
     * @returns
     */
    static from<T>(arrayLike: ArrayLike<T> | Iterable<T>): _ccArray<T>;
}
export interface CcArrayFactory {
    /**
     * 创建指定长度的增强数组
     * @param length 数组长度
     * @example ccArray<number>(10) // 创建长度为10的数组
     */
    <T>(length: number): _ccArray<T>;
    /**
     * 创建包含指定元素的增强数组
     * @param items 数组元素
     * @example ccArray(1, 2, 3) // 创建包含 1,2,3 的数组
     */
    <T>(...items: T[]): _ccArray<T>;
    /**
     * 从 ArrayLike 或 Iterable 创建增强数组
     * @param arrayLike 类数组或可迭代对象
     * @example ccArray.from([1,2,3])
     */
    from<T>(arrayLike: ArrayLike<T> | Iterable<T>): _ccArray<T>;
}
/**
 * 增强数组工厂函数，不污染全局 Array.prototype
 * @example
 * ccArray(10)           // 创建长度为10的数组
 * ccArray(1, 2, 3)      // 创建包含 1,2,3 的数组
 * ccArray.from([1,2,3]) // 从普通数组转换
 */
export declare const ccArray: CcArrayFactory;
