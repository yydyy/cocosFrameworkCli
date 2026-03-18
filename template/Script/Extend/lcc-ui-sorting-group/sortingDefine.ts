// @FilePath: sortingDefine.ts
/*
 * @Author: yyd
 * @Date: 2024-05-07 13:59:27
 * @LastEditTime: 2024-07-29 09:44:47
 * @FilePath: \cocosTools\assets\Script\Extend\lcc-ui-sorting-group\sortingDefine.ts
 * @Description:  
 */

/**
 * 排序层级
 */
export enum SortingLayer {

    /** 
     * 默认层级，此枚举必须保留，并且值不能修改
     */
    DEFAULT = 0,
    ONE,
    TWO,
    THREE,
    // CLUB = 1,//休闲圈的层级
    // SHOP,
    // GAME,//
}

/**
 * 在层级中最大排序值
 */
export const ORDER_IN_LAYER_MAX = 100000;
