/*
 * @Author: yyd
 * @Date: 2026-03-17 07:59:33
 * @LastEditTime: 2026-03-17 09:37:48
 * @FilePath: \scriptCodes\src\index.ts
 * @Description:  核心脚本入口文件
 */
// Core scripts entry point
import './extensions'; // 导入所有扩展模块，确保它们生效
import './extensions/Clog';
import './extensions/SafeAsync';
import './core/RegisterClass';
import { _ccArray, ccArray } from './extensions/Array';

// 直接从装饰器模块导入
import { SingleFunc, SingletonProxy, Identifiable, getOnlyId, registerClass, registerCtrlId, registerEvent, registerView, registerApp } from './decorators';

// 定义全局对象 $gb (global)
const $gb = {
    // 装饰器
    SingleFunc,
    SingletonProxy,
    Identifiable,
    getOnlyId,
    registerClass,
    registerCtrlId,
    registerEvent,
    registerView,
    registerApp
};

// 类型别名 - 使用 typeof 避免重复定义
type GlobalObjectType = typeof $gb
type CcArrayFactoryType = typeof ccArray
// 直接定义 _ccArray 的类型，避免循环引用
type CcArrayClassType = typeof _ccArray

// 全局变量声明 - 让 TypeScript 能识别全局变量
declare global {
    interface Window {
        $gb: GlobalObjectType
        _ccArray: CcArrayClassType
        ccArray: CcArrayFactoryType
    }
    // 全局变量声明
    const $gb: GlobalObjectType;
    const ccArray: CcArrayFactoryType
    const _ccArray: CcArrayClassType;

    type ccArrayType<T> = _ccArray<T>
}

// 只导出 $gb 和必要的扩展
export {
    _ccArray,
    ccArray,
    $gb
};

export default $gb;

window.$gb = $gb;
window._ccArray = _ccArray;
window.ccArray = ccArray; // 保留 ccArray 的全局暴露，因为它是常用的扩展
