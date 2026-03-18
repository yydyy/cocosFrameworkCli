// @FilePath: Array.ts
/*
 * @Author: yyd
 * @Date: 2023-04-28 09:54:45
 * @LastEditTime: 2026-03-16 15:53:01
 * @FilePath: \scriptCodes\src\extensions\Array.ts
 * @Description:  ccArray 不污染全局的增强数组
 */


// 比较器
const _isEqualComparators = {
    reference: (a: any, b: any) => a === b,
    shallow: (a: any, b: any) => a === b || (Number.isNaN(a) && Number.isNaN(b)),
    deep: function deepEqual(a: any, b: any, seen: WeakMap<any, any> = new WeakMap()): boolean {
        if (a === b) return true;
        if (Number.isNaN(a) && Number.isNaN(b)) return true;
        if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
        if (seen.has(a) && seen.get(a) === b) return true;
        seen.set(a, b);
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => deepEqual(a[key], b[key], seen));
    }
};

const _isEqualSortFn = (a: any, b: any) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
};

// ==================== ccArray 类（不污染全局）====================

/**
 * 增强数组类，不污染全局 Array.prototype
 * @example
 * const arr = ccArray(1, 2, 3);       // 工厂函数创建
 * const arr2 = ccArray<number>(10);   // 指定长度
 * const arr3 = ccArray.from([1,2,3]); // 从普通数组转换
 */
export class _ccArray<T> extends Array<T> {
    /**
     * 构造函数 - 正确处理 Array 继承
     */
    constructor(...items: T[]) {
        super(...items);
        Object.setPrototypeOf(this, _ccArray.prototype);
    }
    
    /**
     * 获取第一个元素
     */
    get firstOne(): T | undefined { return this[0]; }
    /**
     * 获取最后一个元素
     * @returns 
     */
    get lastOne(): T | undefined { return this[this.length - 1]; }
    /**
     * 判断数组是否为空
     * @returns 
     */
    get isEmpty(): boolean { return this.length === 0; }

    /**
     * 倒序遍历
     * @param callback 
     * @returns 
     */
    reverseForEach(callback: (value: T, index: number, arr: T[]) => void | boolean): this {
        for (let i = this.length - 1; i >= 0; i--) {
            if (callback?.(this[i], i, this)) break;
        }
        return this;
    }

    /**
     * 检查并添加元素
     * @param ele 元素
     * @returns 
     */
    pushCheck(ele: T): boolean {
        if (!this.includes(ele)) return !!this.push(ele);
        return false;
    }

    /**
     * 检查数组中的元素是否有效
     * @returns 
     */
    checkCCValid(): boolean {
        for (let i = 0; i < this.length; i++) {
            if (!cc.isValid(this[i])) return false;
        }
        return true;
    }

    /**
     * 获取元素的个数
     * @param value 元素
     * @returns 
     */
    valueCount(value: T): number {
        let count = 0;
        for (let i = 0; i < this.length; i++) {
            if (this[i] == value) count++;
        }
        return count;
    }

    /**
     * 重复添加元素
     * @param ele 元素
     * @param count 重复次数
     * @returns 
     */
    repeatPush(ele: T, count: number = 1): this {
        for (let i = 0; i < count; i++) this.push(ele);
        return this;
    }

    /**
     * 删除元素
     * @param ele 元素
     * @param deleteNum 删除次数
     * @returns 
     */
    deleteElement(ele: T | T[], deleteNum: number = 1): this {
        const length = this.length;
        if (length === 0 || ele == null) return this;
        if (Array.isArray(ele)) {
            const countMap = new Map<T, number>();
            for (const e of ele) countMap.set(e, (countMap.get(e) || 0) + 1);
            let writeIndex = 0;
            for (let i = 0; i < length; i++) {
                const item = this[i];
                const count = countMap.get(item);
                if (count && count > 0) countMap.set(item, count - 1);
                else this[writeIndex++] = item;
            }
            this.length = writeIndex;
        } else {
            let deleteCount = 0, writeIndex = 0;
            for (let i = 0; i < length; i++) {
                const item = this[i];
                if (item === ele && deleteCount < deleteNum) deleteCount++;
                else this[writeIndex++] = item;
            }
            this.length = writeIndex;
        }
        return this;
    }

    /**
     * 判断两个数组是否相等
     * @param arr 数组
     * @param compareType 比较类型
     * @param ignoreOrder 是否忽略顺序
     * @param exAry 排除的元素
     * @returns 
     */
    isEqual(arr: T[], compareType: "reference" | "shallow" | "deep" = "reference", ignoreOrder = false, exAry?: T | T[]): boolean {
        const filterFn = (v: T) => Array.isArray(exAry) ? !exAry.includes(v) : v !== exAry;
        let orgAry: T[] = exAry !== undefined ? [...this].filter(filterFn) : [...this];
        let tarAry: T[] = exAry !== undefined ? [...arr].filter(filterFn) : [...arr];
        if (orgAry.length !== tarAry.length) return false;
        if (orgAry.length === 0) return true;
        if (ignoreOrder) {
            const isPrimitive = (v: any) => typeof v === 'number' || typeof v === 'string';
            if (orgAry.every(isPrimitive) && tarAry.every(isPrimitive)) {
                orgAry.sort(_isEqualSortFn);
                tarAry.sort(_isEqualSortFn);
            }
        }
        const compare = _isEqualComparators[compareType] || _isEqualComparators.reference;
        return orgAry.every((item, index) => compare(item, tarAry[index]));
    }

    /**
     * 从 ArrayLike 或 Iterable 创建增强数组
     * @param arrayLike 类数组或可迭代对象
     * @returns 
     */
    static from<T>(arrayLike: ArrayLike<T> | Iterable<T>): _ccArray<T> {
        const result = new _ccArray<T>();
        if (Symbol.iterator in Object(arrayLike)) {
            const iterator = (arrayLike as Iterable<T>)[Symbol.iterator]();
            let next;
            while (!(next = iterator.next()).done) {
                result.push(next.value);
            }
        } else {
            const arr = arrayLike as ArrayLike<T>;
            for (let i = 0; i < arr.length; i++) result.push(arr[i]);
        }
        return result;
    }
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
export const ccArray: CcArrayFactory = function <T>(...args: any[]): _ccArray<T> {
    if (args.length === 1 && typeof args[0] === 'number') {
        const arr = new _ccArray<T>();
        arr.length = args[0];
        return arr;
    }
    const arr = new _ccArray<T>();
    if (args.length > 0) arr.push(...args);
    return arr;
} as CcArrayFactory;

ccArray.from = _ccArray.from;

