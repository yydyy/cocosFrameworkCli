declare module 'core-scripts/core/RegisterClass' {
  type ConstructorTemplateType<T = any> = new (...args: any[]) => T;
  type BaseType = number | string;
  class RegisterClass {
      private _registerMap;
      get onlyId(): number;
      get className(): string;
      /**
       * 注册类|Func
       * @param id
       * @param target 类构造函数或函数
       */
      setClass(id: BaseType, target: ConstructorTemplateType | Function): void;
      /**
       * 根据id获取类|Func
       * @param id 类的唯一标识
       * @returns 类构造函数
       */
      getClassById<T = any>(id: BaseType): T | undefined;
      /**
       * 根据类|Func获取id
       * @param target 类构造函数或函数
       * @returns
       */
      getIdByTarget(target: ConstructorTemplateType | Function): BaseType | null;
      private _registerWeakMap;
      /**
       * 注册组件的 xxxxx 方法,在组件  xxx  时调用
       * 主要防止 多次hook 同个函数导致被顶掉的问题  不能注册onDestroy 有专门的方法
       * @param component
       * @param hookFunction
       * @returns
       */
      /**
       * 注册组件的销毁清理函数，在组件的 onDestroy 等 方法内执行。
       * 主要防止多次 hook 同个函数导致被顶掉的问题。
       * @param component 要 Hook 的组件实例。
       * @param hookFunction 在组件销毁时执行的清理函数。
       */
      registerDestroyHook(component: cc.Component, hookFunction: Function): void;
  }
  /**
   * 类|Func 注册中心
   */
  export const gRegisterClass: RegisterClass;
  global {
      interface Window {
          gRegisterClass: RegisterClass;
      }
      /**     * 类|Func 注册中心     */
      const gRegisterClass: RegisterClass;
  }
  export {};

}
declare module 'core-scripts/decorators/Identifiable' {
  export function getOnlyId(): number;
  /**
   * 唯一 ID 类装饰器
   * @param constructor
   * @returns
   */
  export function Identifiable<T extends new (...args: any[]) => any>(constructor: T): T;

}
declare module 'core-scripts/decorators/index' {
  import { SingleFunc, SingletonProxy, SingleFuncClass } from 'core-scripts/decorators/Singleton';
  import { Identifiable, getOnlyId } from 'core-scripts/decorators/Identifiable';
  import { registerClass, registerCtrlId, registerEvent, registerView, registerApp } from 'core-scripts/decorators/Registrars';
  export { SingleFunc, SingletonProxy, SingleFuncClass, Identifiable, getOnlyId, registerClass, registerCtrlId, registerEvent, registerView, registerApp, };
  const _default: {
      SingleFunc: typeof SingleFunc;
      SingletonProxy: typeof SingletonProxy;
      Identifiable: typeof Identifiable;
      getOnlyId: typeof getOnlyId;
      registerClass: typeof registerClass;
      registerCtrlId: typeof registerCtrlId;
      registerEvent: typeof registerEvent;
      registerView: typeof registerView;
      registerApp: typeof registerApp;
  };
  export default _default;

}
declare module 'core-scripts/decorators/Registrars' {
  interface IViewDefined {
      uid: string;
      path: string;
      bundle?: string;
      windowType?: string;
      zdx?: number;
  }
  type BaseType = number | string;
  type ConstructorTemplateType<T = any> = new (...args: any[]) => T;
  import type { SingleFuncClass } from 'core-scripts/decorators/Singleton';
  /**
   * 将 class 注入到注册中心，方便根据 id 获取 class 来实例化
   * @param id
   * @returns
   */
  export function registerClass(id: BaseType): (target: any) => void;
  /**
   * 注册控制器 ID 的装饰器，使用 npm run generate-ctrl-map 生成类型文件
   * 注意：此装饰器会被插件识别并提取控制器 ID
   * @param id 控制器 ID
   *
   * @example
   * ```typescript
   * @registerCtrlId("BattleCtrl")
   * export class BattleCtrl extends BaseCtrl { }
   *
   * // 或使用 xxx.ID 格式
   * @registerCtrlId(CtrlId.BattleCtrl)
   * export class BattleCtrl extends BaseCtrl { }
   *
   * $app.ctrl.getCtrlOrAdd(CtrlId.BattleCtrl) // 获取控制器实例
   * ```
   */
  export function registerCtrlId(id: string): (target: any) => void;
  /**
   * 注册事件类型的标志，用于类型检查，使用 npm run generate-event-type 生成类型文件
   * 注意：此函数仅用于类型标记，不会实际执行，参数中的函数类型会被插件提取
   * @param id 事件类型
   * @param funcType 函数类型声明，不用传入，声明类型 T 就行
   *
   * @example
   * ```typescript
   * registerEvent<(data: string) => void>("CUSTOM_EVENT")
   * registerEvent<(data: number) => boolean>("MY_TEST")
   * registerEvent<(data: symbol) => void>("OPP")
   *
   * // 或使用 xxx.ID 格式
   * registerEvent<(data: string) => void>(GameEvents.CUSTOM_EVENT)
   * ```
   */
  export function registerEvent<T extends Function>(id: string, funcType?: T): void;
  /**
   * 注册界面定义
   * 支持两种用法：
   * 1. 作为函数调用：registerView({ uid: "MainView", ... })
   * 2. 作为装饰器：@registerView({ uid: "MainView", ... })
   * @param viewInfo 界面定义
   */
  export function registerView(viewInfo: IViewDefined): any;
  /**
   * 注册单例到 $app
   * @param key $app 上的属性名
   * @param singleton 单例对象（支持 SingleFunc / SingletonProxy / 普通对象）
   * @example
   * ```typescript
   * // 1. 类型声明
   * module "../../App" {
   *     interface IAppExtend { battle: InstanceType<typeof BattleMgr> }
   * }
   *
   * // 2. 定义单例
   * export const BattleMgr = SingleFunc(class {  或者 SingletonProxy(class {
   *     startBattle() { }
   * })
   *
   * // 3. 注册到 $app
   * registerApp("battle", BattleMgr)
   *
   * // 4. 使用
   * $app.battle.startBattle()
   *
   * //注意：如果在update中或者高频访问，做缓存优化
   * //缓存引用
   * private _battle = $app.battle
   * update(dt) {
   *     this._battle.tick(dt)  // 直接访问
   * }
   * ```
   */
  export function registerApp<T>(key: string, singleton: SingleFuncClass<T> | ConstructorTemplateType<T> | T): void;
  export {};

}
declare module 'core-scripts/decorators/Singleton' {
  type ConstructorTemplateType<T = any> = new (...args: any[]) => T;
  export type SingleInstance<T extends new (...args: any) => any> = T & {
      /**单例对象方法 */
      Ins: (...args: ConstructorParameters<T>) => InstanceType<T>;
  };
  /**
   * 单利方法
   * @example
   * target依然可以继承,不会有影响
   * 推荐用法
   * const MyClass = SingleFunc(class {})
   * 或者
   * const MyClass = SingleFunc(class extends ParentClass {})
   * 或者
   * const p:InstanceType<typeof(MyClass)>=new MyClass()          //这是特殊需求
   * @param
   * @returns
   */
  export function SingleFunc<T extends ConstructorTemplateType<any>>(target: T): SingleInstance<T>;
  /** SingleFunc 包装后的类型 */
  export type SingleFuncClass<T = any> = {
      Ins: (...args: any[]) => T;
  };
  /**
   * 单例构造函数包装器
   * 不管 new 多少次，返回的都是同一个实例
   * 注意由于修改了constructor，不支持继层，不然new出来也不会走子类的构造
   * @param classCtor 原始类构造函数
   * @param args 构造函数参数 首次有效
   * @example
   * const MySingleton = SingletonProxy(MyClass);
   * const a = new MySingleton();
   * const b = new MySingleton();
   * console.log(a === b); // true
   */
  export function SingletonProxy<T extends new (...args: any[]) => any>(classCtor: T, ...args: any[]): T;
  export {};

}
declare module 'core-scripts/extensions/Array' {
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
  export const ccArray: CcArrayFactory;

}
declare module 'core-scripts/extensions/Clog' {
  export interface LogFunc extends Console {
      /**默认日志 */
      log: (...args: any[]) => void;
      /**错误日志 */
      error: (...args: any[]) => void;
      /**警告日志 */
      warn: (...args: any[]) => void;
      /**网络日志 */
      net: (...args: any[]) => void;
      /**数据 | 控制日志 */
      model: (...args: any[]) => void;
      /**视图日志 */
      view: (...args: any[]) => void;
      /**配置日志 */
      config: (...args: any[]) => void;
      /**单纯换行 */
      space: () => void;
      /**设置日志标签 */
      setTags: (tag: number) => void;
  }
  /**日志类型 */
  export enum LogType {
      /** 网络层日志 */
      net = 1,
      /** 数据结构层日志 */
      model = 2,
      /** 视图层日志 */
      view = 4,
      /** 配置日志 */
      config = 8,
      /** 错误日志 */
      error = 16,
      /** 警告日志 */
      warn = 32,
      /** 标准日志 */
      log = 64
  }
  export class CLog {
      private _globalTag;
      setTags(tag: number): void;
      constructor();
      /**
     * 重写 console.error 以过滤特定错误
     */
      private _patchConsoleerror;
      /**
       * 创建代理
       * @returns
       */
      createProxy(): LogFunc;
  }
  global {
      interface Window {
          clog: LogFunc;
      }
      const clog: LogFunc;
  }

}
declare module 'core-scripts/extensions/index' {
  import './Array';
  import './String';
  import './Number';

}
declare module 'core-scripts/extensions/Number' {
  global {
      interface Number {
          toNumber(): number;
          /**转换成  亿  万 显示*/
          transShowZh(): string;
          /** 转换成  亿  万 显示 英文 W Y */
          transShowEn(): string;
      }
  }
  export {};

}
declare module 'core-scripts/extensions/SafeAsync' {
  export {};
  /**
   * 配合isValid使用，自动捕获 async 函数中的“静默中断”错误，防止控制台报红
   * @param target 类实例
   * @param propertyKey 方法名
   * @param descriptor 方法描述符
   * @returns
   */
  function SafeAsync(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
  type SafeAsyncType = typeof SafeAsync;
  global {
      /**全局 hook */
      interface Promise<T> {
          /**处理异步后生命周期问题 */
          isValid: <T>(liftTarget: {
              isValid: boolean;
          }) => Promise<T>;
      }
      interface Window {
          /**
           * 异步函数装饰器，自动处理生命周期问题
           */
          SafeAsync: SafeAsyncType;
      }
      var SafeAsync: SafeAsyncType;
  }

}
declare module 'core-scripts/extensions/setTimeOut' {
  /** 延时任务管理器 */
  class TimeoutManager {
      /** 存储所有未执行的延时任务 */
      private _tasks;
      /** 当前任务 ID 计数器 */
      private _taskIdCounter;
      /**
       * 创建安全的延时任务
       * @param callback 回调函数
       * @param delay 延时时间（毫秒）
       * @param group 可选的分组标识
       * @returns 任务 ID，可用于手动取消
       */
      setTimeout(callback: () => void, delay: number, group?: string): number;
      /**
       * 清除延时任务
       * @param group 可选的分组标识
       * - 如果不传，清除所有未执行的延时
       * - 如果传递，只清除该分组的延时
       */
      clearTimeout(group?: string): void;
      /**
       * 获取指定分组的任务数量
       * @param group 分组标识
       * @returns 任务数量
       */
      getGroupCount(group: string): number;
      /**
       * 获取所有未执行的任务数量
       * @returns 任务总数
       */
      getTotalCount(): number;
  }
  const timeoutManager: TimeoutManager;
  /**
   * 安全的延时函数，支持分组管理
   * @param callback 回调函数
   * @param delay 延时时间（毫秒）
   * @param group 可选的分组标识
   * @returns 任务 ID，可用于手动取消
   *
   * @example
   * ```typescript
   * // 基本用法
   * setTimeOutSafe(() => {
   *     console.log("3 秒后执行");
   * }, 3000);
   *
   * // 分组管理
   * setTimeOutSafe(() => {
   *     console.log("UI 更新");
   * }, 1000, "ui");
   *
   * setTimeOutSafe(() => {
   *     console.log("网络请求");
   * }, 2000, "network");
   *
   * // 清除指定分组
   * clearTimeoutSafe("ui"); // 只清除 ui 分组的延时
   *
   * // 清除所有
   * clearTimeoutSafe(); // 清除所有未执行的延时
   * ```
   */
  export function setTimeOutSafe(callback: () => void, delay: number, group?: string): number;
  /**
   * 清除延时任务
   * @param group 可选的分组标识
   * - 如果不传，清除所有未执行的延时
   * - 如果传递，只清除该分组的延时
   *
   * @example
   * ```typescript
   * clearTimeoutSafe(); // 清除所有
   * clearTimeoutSafe("network"); // 只清除 network 分组
   * ```
   */
  export function clearTimeoutSafe(group?: string): void;
  export { timeoutManager, TimeoutManager };
  type setTimeOutSafeType = typeof setTimeOutSafe;
  type clearTimeoutSafeType = typeof clearTimeoutSafe;
  global {
      interface Window {
          setTimeOutSafe: setTimeOutSafeType;
          clearTimeoutSafe: clearTimeoutSafeType;
          /**
          * 延时任务管理器  只有在debug模式下才会有实例
         */
          timeOutMgr?: TimeoutManager;
      }
      var setTimeOutSafe: setTimeOutSafeType;
      var clearTimeoutSafe: clearTimeoutSafeType;
  }

}
declare module 'core-scripts/extensions/String' {
  global {
      interface String {
          /**
          * 格式化字符串 %[sdf]
          * @示例：
          * "%d上学了".format("小金鱼")   @打印:
          *  小金鱼上学了
          */
          format: (...args: any[]) => string;
          /**
           * 将string转换为number  得确认是数字才能转换
           * @returns
           */
          toNumber: () => number;
          /**
           * 将字符串按照splitName的名字转换为数组
           * @param splitName 分割符
           * @param isTransNumber 是否都转换为number[]
           * @returns
           */
          toAry: (splitName: string, isTransNumber: boolean) => string[] | number[];
          /**
           * 直接只用字符串克隆出节点
           * @param parent
           * @param name
           */
          clonePrefab: (lifeTarget?: any, parent?: any, name?: string) => Promise<any>;
          /**
           * 通过字符串克隆并返回用户自定义的脚本
           * @param type
           * @param parent
           * @param name
           */
          clonePrefabScript<T>(type: {
              new (): T;
          }, lifeTarget?: any, parent?: any, name?: string): Promise<T>;
          /**
           * 最后一个字符
           * @returns
           */
          lastChar: () => string;
      }
  }
  export {};

}
declare module 'core-scripts/index' {
  import './extensions';
  import './extensions/Clog';
  import './extensions/SafeAsync';
  import './core/RegisterClass';
  import { _ccArray, ccArray } from 'core-scripts/extensions/Array';
  import { SingleFunc, SingletonProxy, Identifiable, getOnlyId, registerClass, registerCtrlId, registerEvent, registerView, registerApp } from 'core-scripts/decorators/index';
  const $gb: {
      SingleFunc: typeof SingleFunc;
      SingletonProxy: typeof SingletonProxy;
      Identifiable: typeof Identifiable;
      getOnlyId: typeof getOnlyId;
      registerClass: typeof registerClass;
      registerCtrlId: typeof registerCtrlId;
      registerEvent: typeof registerEvent;
      registerView: typeof registerView;
      registerApp: typeof registerApp;
  };
  type GlobalObjectType = typeof $gb;
  type CcArrayFactoryType = typeof ccArray;
  type CcArrayClassType = typeof _ccArray;
  global {
      interface Window {
          $gb: GlobalObjectType;
          _ccArray: CcArrayClassType;
          ccArray: CcArrayFactoryType;
      }
      const $gb: GlobalObjectType;
      const ccArray: CcArrayFactoryType;
      const _ccArray: CcArrayClassType;
      type ccArrayType<T> = _ccArray<T>;
  }
  export { _ccArray, ccArray, $gb };
  export default $gb;

}
declare module 'core-scripts' {
  import main = require('core-scripts/src/index');
  export = main;
}