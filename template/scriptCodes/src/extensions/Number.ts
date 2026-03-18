// @FilePath: Number.ts

//number最大只能表示9000多兆，超过了要使用bigint来表示    

declare global {
    interface Number {
        toNumber(): number
        /**转换成  亿  万 显示*/
        transShowZh(): string;
        /** 转换成  亿  万 显示 英文 W Y */
        transShowEn(): string
    }
}

function formatUnitPart(num: number, divisor: number, padLength: number): string {
    const integerPart = Math.floor(num / divisor);
    const decimalPart = num % divisor;
    let result = integerPart.toString();
    if (decimalPart > 0) {
        const decimalStr = String(decimalPart).padStart(padLength, '0').substring(0, padLength);
        const firstTwoDigits = decimalStr.substring(0, 2);
        const decimalValue = parseInt(firstTwoDigits, 10);
        if (decimalValue > 0) {
            const decimalDisplay = (decimalValue / 100).toFixed(2)
                .replace(/\.?0+$/, '') // 去除末尾的零
                .replace(/^0\./, '.'); // 将"0.12"转换为".12"
            result += decimalDisplay;
        }
    }
    return result;
}

if (!Number.prototype.transShowZh) {
    Number.prototype.transShowZh = function () {
        const num = Number(this);
        if (num >= 1e8) {  // 处理亿单位       
            return formatUnitPart(num, 1e8, 8) + '亿';
        } else if (num >= 1e4) {  // 处理万单位
            return formatUnitPart(num, 1e4, 4) + '万';
        } else {
            return num.toString();
        }
    }
}

if (!Number.prototype.transShowEn) {
    Number.prototype.transShowEn = function () {
        const num = Number(this);
        if (num >= 1e8) {  // 处理亿单位       
            return formatUnitPart(num, 1e8, 8) + 'Y';
        } else if (num >= 1e4) {  // 处理万单位
            return formatUnitPart(num, 1e4, 4) + 'W';
        } else {
            return num.toString();
        }
    }
}

if (!Number.prototype.toNumber) {
    Number.prototype.toNumber = function () {
        return Number(this);
    }
}

export {};
