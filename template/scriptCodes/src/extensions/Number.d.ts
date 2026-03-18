declare global {
    interface Number {
        toNumber(): number;
        /**转换成  亿  万 显示*/
        transShowZh(): string;
        /** 转换成  亿  万 显示 英文 W Y */
        transShowEn(): string;
    }
}
export {};
