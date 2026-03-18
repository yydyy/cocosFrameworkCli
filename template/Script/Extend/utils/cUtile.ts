// @FilePath: cUtile.ts
/*
 * @Author: yyd
 * @Date: 2022-07-06 13:51:04
 * @LastEditTime: 2025-11-27 09:26:43
 * @FilePath: \cocosTools\assets\Script\Extend\cUtile.ts
 * @Description:  常用函数集
 */

type TypedArray =
    | Int8Array | Uint8Array | Uint8ClampedArray
    | Int16Array | Uint16Array
    | Int32Array | Uint32Array
    | Float32Array | Float64Array;

class cUtile_ {
    /**
     * 严厉判断是否为空  null || undefined
     * @param param 
     * @returns bool
     */
    isUn = (param: any) => param === null || param === undefined;
    /**
     * 是否是对象,注:数组也算对象
     * @param param 
     * @returns bool
     */
    isObject(param: any) {
        return typeof param === 'object' && param !== null
    }
    /**
     * 判断对象是否是Map   ,注:Map也算对象
     * @param param 
     * @returns 
     */
    isMap(param: any) {
        return Object.prototype.toString.call(param) === '[object Map]';
    }
    /**
     * 判断对象是否是Set   ,注:Set也算对象
     * @param param 
     * @returns 
     */
    isSet(param: any) {
        return Object.prototype.toString.call(param) === '[object Set]';
    }
    /**
     * 判断是否是数组
     * @param param 
     * @returns bool
     */
    isArray(param: any) {
        return Array.isArray(param) || (param as any[]) instanceof Array;
    }
    /**
     * 判断是否是数值
     * @param param 
     * @returns bool
     */
    isNumber(param: any) {
        return typeof param === "number" && Number.isFinite(param);
    }
    /**
     * 判断symbol对象
     * @param param 
     * @returns 
     */
    isSymbol(param: any) {
        return typeof param === 'symbol'
    }
    /**判断是否是ArrayBuffer对象 */
    isTypedArray(value: unknown): value is TypedArray {
        return ArrayBuffer.isView(value) && 'slice' in value;
    }
    /**
     * 判断bigInt
     * @param param 
     * @returns 
     */
    //  isBigInt(param: any) {
    //     return BigInt(param) === param
    // }
    /**
    * 判断是否是函数
    * @param param 
    * @returns bool
    */
    isFunction(param: any) {
        return typeof param === "function"
    }
    /**
    * 判断是否是字符串
    * @param param 
    * @returns bool
    */
    isString(param: any): param is string {
        return typeof param === "string";
    }
    /**
     * 生成[min, max]范围内的随机数（支持整数和浮点数）
     * @param min 
     * @param max 
     * @param decimals 小数位数（默认0）
     * @returns 
     */
    random(min: number, max: number, decimals: number = 0): number {
        // 处理反向参数（如min=5, max=3）
        if (min > max) [min, max] = [max, min]
        const baseValue = Math.random() * (max - min)
        const scaledValue = baseValue + min
        // 小数精度处理
        const factor = Math.pow(10, decimals);
        return Math.round(scaledValue * factor) / factor;
    }
    /**
     * 同步等待,延迟多少毫秒执行后面的逻辑,需要在async函数中执行
     * 
     * @注意:
     * 调用函数前面没有await将是一个异步的延时,后面的逻辑不会等待
     * 
     * @param time 毫秒  默认unity下一帧
     * 
     * @用法:
     * var useFun = async function () {
            let o = cUtile.delay(2)  // 2毫秒
            let id = o.id
            await o.wait
            log("延迟执行完毕~~~~~")
        }
        useFun()
     */
    @SafeAsync
    delay(time: number = 1, target?: cc.Component | cc.Node) {
        let timeId: ReturnType<typeof setTimeout>
        const promise = new Promise<void>((resolve) => {
            timeId = setTimeout(() => {
                resolve()
            }, time)
        }).isValid(target)
        return { wait: promise, id: timeId }
    }
    /**
     * 克隆  
     * @param param 
     * @param deep  深度拷贝
     * @returns any
     */
    clone<T>(param: T, deep?: boolean, hash: WeakMap<any, any> = new WeakMap()): T {
        // 处理非对象或浅拷贝
        if (typeof param !== "object" || param === null) {
            return param;
        }
        // 浅拷贝
        if (!deep) {
            if (param instanceof Date) return new Date(param) as T;
            if (param instanceof RegExp) {
                const regex = new RegExp(param.source, param.flags);
                regex.lastIndex = param.lastIndex; // 保留正则状态
                return regex as T;
            }
            if (param instanceof Map) return new Map(param) as T;
            if (param instanceof Set) return new Set(param) as T;
            if (Array.isArray(param)) return [...param] as T;
            // 浅拷贝对象（保留原型链和属性描述符）
            return Object.create(
                Object.getPrototypeOf(param),
                Object.getOwnPropertyDescriptors(param)
            );
        }
        if (hash.has(param)) return hash.get(param);  // 循环引用检测前置
        try {
            // 使用原生API（优先）
            if (typeof structuredClone === "function") {
                return structuredClone(param);
            }
        } catch (error) {
        }
        if (param instanceof Date) return new Date(param.getTime()) as T;
        if (param instanceof RegExp) {
            const regex = new RegExp(param.source, param.flags);
            regex.lastIndex = param.lastIndex;
            return regex as T;
        }
        if (param instanceof Map) {
            const mapClone = new Map();
            hash.set(param, mapClone);
            param.forEach((value, key) => {
                // 递归克隆键值（避免递归栈溢出）
                mapClone.set(
                    this.clone(key, true, hash),
                    this.clone(value, true, hash)
                );
            });
            return mapClone as T;
        }
        if (param instanceof Set) {
            const setClone = new Set();
            hash.set(param, setClone);
            param.forEach(value => {
                setClone.add(this.clone(value, true, hash));
            });
            return setClone as T;
        }
        if (param instanceof Error) {
            const errorClone = new Error(param.message);
            errorClone.stack = param.stack; // 保留调用栈
            return errorClone as T;
        }
        if (ArrayBuffer.isView(param)) {
            // TypedArray 处理（如 Uint8Array）
            if (this.isTypedArray(param)) {
                return param.slice() as T
            } else {
                // DataView 克隆
                const buffer = param.buffer.slice(0);
                return new DataView(buffer) as T;
            }
        }
        // 6. 普通对象/数组的深拷贝
        const cloneTarget = Array.isArray(param)
            ? []
            : Object.create(Object.getPrototypeOf(param));
        hash.set(param, cloneTarget);

        // 复制所有键（含Symbol和不可枚举属性）
        const keys = Reflect.ownKeys(param);
        for (const key of keys) {
            const descriptor = Object.getOwnPropertyDescriptor(param, key)!
            cloneTarget[key] = this.clone(descriptor.value, true, hash)
        }
        return cloneTarget as T;
    }
    /**
     * 转化为数组,如果参数是数组,将返回个新的数组
     * @param param 
     * @returns Array
     */
    toArray<T>(param: Array<T> | Object) {
        if (Array.isArray(param)) {
            return Array.from(param);
        } else if (typeof param === 'object' && param !== null) {
            return Object.values(param);
        } else {
            return [];
        }
    }
    /**
     * 完全同步array.forEach参数位置的forEach
     * @param callBack 返回true将会终止遍历  参数位置  0:数据  1:位序  2:遍历顺序(如果是数组,string ;位序和遍历顺序相等)
     * @param param number | string | any[] | Object
     * @param target callBack的回调对象 
     * @param isReversed 是否逆序(删除会很方便)，只针对数组 number string      逆序目前不支持map  set等
     * @returns null
     */
    forEach<T>(callBack: (v: T, index: number | string | any, wIdex: number) => void | boolean, param: any, target?: any, isReversed: boolean = false) {
        if (typeof callBack !== "function") return clog.error("Callback must be a function");
        if (!param) return;
        const boundCallback = target ? callBack.bind(target) : callBack;
        const seen = new WeakSet();
        // 处理对象（支持嵌套循环引用检测）
        const handleObject = (obj: object) => {
            if (seen.has(obj)) return;
            seen.add(obj)
            let idx = 0
            for (const key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
                const val = obj[key];
                if (boundCallback(val, key, idx++)) return;
            }
        };
        // 高性能 Map/Set 处理
        const handleMapSet = (iterable: Iterable<any>, isMap: boolean) => {
            const iterator = iterable[Symbol.iterator]();
            let idx = 0, next
            // 正向遍历
            if (!isReversed) {
                while (!(next = iterator.next()).done) {
                    const entry = next.value;
                    const [k, v] = isMap ? entry : [idx, entry];
                    if (boundCallback(v, k, idx++)) return;
                }
            }
            // 反向遍历：缓存后逆序索引
            else {
                const stack = Array.from(iterable);
                for (let i = stack.length - 1; i >= 0; i--) {
                    const [k, v] = isMap ? stack[i] : [i, stack[i]];
                    if (boundCallback(v, k, i)) return;
                }
            }
        }
        if (Array.isArray(param)) {
            const length = param.length;
            const step = isReversed ? -1 : 1;
            let i = isReversed ? length - 1 : 0;
            while (i >= 0 && i < length) {
                if (boundCallback(param[i], i, i)) break;
                i += step;
            }
            return;
        }
        else if (param instanceof Map) handleMapSet(param.entries(), true);
        else if (param instanceof Set) handleMapSet(param.values(), false);
        else if (typeof param === "object") handleObject(param);
        else if (typeof param === "number") {
            const length = Math.abs(param);
            const step = isReversed ? -1 : 1;
            let i = isReversed ? length - 1 : 0;
            while (i >= 0 && i < length) {
                if (boundCallback(i as any, i, i)) break;
                i += step;
            }
        }
        else if (typeof param === "string") {
            const len = param.length;
            const chars = isReversed ? Array.from(param).reverse() : param;
            for (let i = 0; i < len; i++) {
                if (boundCallback(chars[i] as any, i, i)) break;
            }
        }
    }
    /**
     * 获取array string object中的value的位置
     * 注意：它只会返回最近的，找到key后就退出遍历
     * @param param 
     * @param value 
     * @returns number
     */
    indexOf(param: any, value: any) {
        if (!param || !value || this.isFunction(param) || this.isNumber(param)) return -1
        let index: any = null
        this.forEach((v: any, idx: any) => {
            index = idx
            if (v === value) return true
        }, param)
        return index
    }
    /**
     * param中的v是否==key
     * @param param 
     * @param key 
     * @returns bool
     */
    include(param: any[] | Object | number | string, key: any) {
        if (this.isUn(param) || this.isFunction(param)) return false
        let ft = false
        this.forEach((v: any, idx: any) => {
            if (v == key) {
                return ft = true
            }
        }, param)
        return ft
    }
    /**
    * 生成对称间距数组
    * 类似-100 -50 0 50 100
    * @param point 需要生成的点的数量
    * @param pixOff 间距
    * @param beginPos 开始位置
    */
    generatePoints(pointCount: number, pixOff: number, beginPos: number = 0) {
        if (pointCount == 0) return [0]
        var points: number[] = new Array(pointCount);
        const halfCount = (pointCount - 1) / 2;
        this.forEach((v: number, index: number) => {
            const m = index - halfCount;
            points[index] = m * pixOff + beginPos;
        }, pointCount)
        return points
    }
    /**
     * 格式化时间
     * @param time 时间戳(毫秒)
     * @param format 格式化样式   yyyy-MM-dd
     * eg:
     * @"yyyy-MM-dd hh:mm:ss.S"==> 2006-07-02 08:09:04.423 
     * @"yyyy-M-d h:m:s.S   ==> 2006-7-2 8:9:4.18
     * @ 
     * @     'y+':年,
        @    "M+"：月份 
        @    "d+": , 日 
        @    "h+": 小时 
        @    "m+": 分 
        @    "s+": 秒 
        @    "q+":季度 
        @    "S": 毫秒 
     */
    formatTime(time: number, format: string = "hh:mm:ss") {
        const pDate = new Date(time);
        const qs = Math.floor((pDate.getMonth() + 3) / 3);
        const milliseconds = pDate.getMilliseconds();

        const replacements = {
            'y+': pDate.getFullYear(),
            "M+": pDate.getMonth() + 1,
            "d+": pDate.getDate(),
            "h+": pDate.getHours(),
            "m+": pDate.getMinutes(),
            "s+": pDate.getSeconds(),
            "q+": qs,
            "S": milliseconds,
        };

        this.forEach((v: number, pattern: string) => {
            const regex = new RegExp(pattern);
            format = format.replace(regex, (match) => {
                const value = v.toString();
                if (/(y+)/.test(match)) {
                    return value.substring(4 - match.length);
                } else {
                    return match.length === 1 ? value : value.padStart(match.length, '0');
                }
            });
        }, replacements)
        return format;
    }
}
/**
 * 常用函数集
 */
export const cUtile = $gb.SingleFunc(cUtile_)
