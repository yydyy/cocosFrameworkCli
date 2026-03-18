// @FilePath: Symbol.ts

interface Symbol {
    toNumber(): number;
}

Symbol.prototype.toNumber = function () {
    console.warn("symbol类型没有toNumber(),默认返回0")
    return 0
}