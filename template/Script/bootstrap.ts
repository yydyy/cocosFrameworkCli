// @FilePath: bootstrap.ts
/*
 * @Author: yyd
 * @Description: 确保原型扩展和全局变量在其他模块之前加载
 * 只包含必须提前执行的模块，管理器等按需导入
 */

// ==================== 1. 原型扩展（最先加载）====================
import "./Extend/prototype/Deserialize"

// ==================== 2. 装饰器 ====================


// ==================== 3. 其局变量 ====================
import "./Extend/Base/Ectrl"
import "./Extend/Base/UiDefines"
import "./Extend/Base/Events"


