export declare function getOnlyId(): number;
/**
 * 唯一 ID 类装饰器
 * @param constructor
 * @returns
 */
export declare function Identifiable<T extends new (...args: any[]) => any>(constructor: T): T;
