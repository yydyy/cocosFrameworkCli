# 代码生成插件使用文档

本目录包含 5 个代码生成插件，用于自动扫描项目代码并生成类型声明文件，提升 TypeScript 类型安全性和开发体验。

## 📦 插件列表

| 插件名称 | 用途 | 生成文件 | NPM 命令 |
|----------|------|----------|----------|
| `generate-view-map.js` | 界面注册映射生成 | `GenerateViewExtend.d.ts`, `GenerateViewExtend.ts` | `npm run generate-view-map` |
| `generate-ctrl-map.js` | 控制器 ID 映射生成 | `GenerateCtrlIdExtend.d.ts`, `GenerateCtrlIdExtend.ts` | `npm run generate-ctrl-map` |
| `generate-event-type.js` | 事件类型扩展生成 | `GenerateEventExtend.d.ts`, `GenerateEventsExtend.ts` | `npm run generate-event-type` |
| `generate-bundle-map.js` | Bundle 资源包类型生成 | `GenerateBundleExtend.d.ts` | `npm run generate-bundle-map` |
| `generate-app-extend.js` | 应用扩展类型生成 | `GenerateAppExtend.d.ts` | `npm run generate-app-extend` |

### 🚀 一键运行所有插件

```bash
# 运行所有生成器（推荐）
npm run all
```

---

## 1️⃣ generate-view-map.js - 界面注册映射生成器

### 📌 功能说明
自动扫描项目中所有 `registerView` 调用，生成界面 ID 映射的类型声明和运行时文件。

### 📝 使用方式

#### 1. 注册界面

作为装饰器使用：
```typescript
import { registerView } from "../decorator/Decorate";
import { UiId, WindowType, Bundles, UiZdxType } from "../Extend/Base/UiDefines";

@ccclass
@registerView({
    uid: UiId.MainView,
    path: "view/MainView",
    bundle: Bundles.common,
    windowType: WindowType.Full,
    zdx: UiZdxType.default,
})
export default class MainView extends BaseView {
    // 界面逻辑
}

@ccclass
@registerView({
    uid: "BattleView",
    path: "view/BattleView",
    bundle: Bundles.common,
    windowType: WindowType.Dialog,
    zdx: UiZdxType.default,
})
export default class BattleView extends BaseView {
    // 界面逻辑
}
```

作为函数调用：
```typescript
import { registerView } from "../decorator/Decorate";
import { UiId, WindowType, Bundles, UiZdxType } from "../Extend/Base/UiDefines";

// 注册界面
registerView({
    uid: UiId.ShowView,
    path: "view/ShowView",
    bundle: Bundles.common,
    windowType: WindowType.Full,
    zdx: UiZdxType.default,
});
```

#### 2. 运行生成命令
```bash
npm run generate-view-map
```

#### 3. 生成的文件

**GenerateViewExtend.d.ts**:
```typescript
declare module "../../Extend/Base/UiDefines" {
    interface IUiIdExtend {
        MainView: "MainView";
        BattleView: "BattleView";
        ShowView: "ShowView";
    }
}
```

**GenerateViewExtend.ts**:
```typescript
import { UiId, registerViewInfo, WindowType, UiZdxType } from "../Extend/Base/UiDefines";
import { Bundles } from "../Extend/Base/Bundles";

// 界面信息定义
const MainViewViewInfo = {
    uid: "MainView",
    path: "view/MainView",
    bundle: Bundles.common,
    windowType: WindowType.Full,
    zdx: UiZdxType.default,
};

const BattleViewViewInfo = {
    uid: "BattleView",
    path: "view/BattleView",
    bundle: Bundles.common,
    windowType: WindowType.Dialog,
    zdx: UiZdxType.default,
};

const ShowViewViewInfo = {
    uid: "ShowView",
    path: "view/ShowView",
    bundle: Bundles.common,
    windowType: WindowType.Full,
    zdx: UiZdxType.default,
};

// 界面信息映射
const viewInfoMap = {
    "MainView": MainViewViewInfo,
    "BattleView": BattleViewViewInfo,
    "ShowView": ShowViewViewInfo
};

// 注册UiId和viewInfo
for (const key in viewInfoMap) {
    const viewName = key as UiIdType;
    if (!UiId[viewName]) {
        UiId[key] = viewName;
    }
    registerViewInfo(viewName, viewInfoMap[key]);
}
```

### ✅ 特性
- 支持装饰器形式：`@registerView({...})`
- 支持函数调用形式：`registerView({...})`
- 自动识别 `uid` 的两种格式：字符串和 `UiId.xxx`
- 智能检测并忽略被注释的调用（支持 `//` 和 `/* */`）
- 支持嵌套的 `viewInfo` 对象
- 自动修复 `WindowType.Popup` 为 `WindowType.Dialog`
- 生成类型安全的界面 ID 映射
- 生成运行时注册代码

---

## 2️⃣ generate-ctrl-map.js - 控制器 ID 映射生成器

### 📌 功能说明
自动扫描所有使用 `@registerCtrlId(CtrlId.xxx)` 装饰器的类，生成控制器 ID 映射的类型声明和运行时文件。

### 📝 使用方式

#### 1. 注册控制器类
```typescript
import { registerCtrlId } from "../decorator/Decorate";
import { CtrlId } from "./Ectrl";

// 使用 @registerCtrlId 装饰器注册控制器
@registerCtrlId(CtrlId.BattleCtrl)
export class BattleCtrl extends BaseCtrl {
    // 控制器逻辑
}

@registerCtrlId(CtrlId.TestCtrl)
export class TestCtrl extends BaseCtrl {
    // 控制器逻辑
}
```

#### 2. 运行生成命令
```bash
npm run generate-ctrl-map
```

#### 3. 生成的文件

**GenerateCtrlIdExtend.d.ts**:
```typescript
declare module "./Ectrl" {
    interface ICtrlIdExtend {
        BattleCtrl: "BattleCtrl";
        TestCtrl: "TestCtrl";
    }

    interface ICtrlTypeMap {
        BattleCtrl: BattleCtrl
        TestCtrl: TestCtrl
    }
}
```

**GenerateCtrlIdExtend.ts**:
```typescript
import { CtrlId } from "../Extend/Base/Ectrl";

const ctrlIds = ["BattleCtrl", "TestCtrl"];

// 注册CtrlId
for (const ctrlId of ctrlIds) {
    CtrlId[ctrlId] = ctrlId;
}
```

### ✅ 特性
- 自动识别 `@registerCtrlId` 装饰器
- 检测并忽略被注释的装饰器
- 支持字符串和 `CtrlId.xxx` 格式
- 同时生成类型声明和运行时映射
- 使用数组和循环优化代码结构

---

## 3️⃣ generate-event-type.js - 事件类型扩展生成器

### 📌 功能说明
自动扫描项目中所有 `registerEvent` 调用，生成事件回调类型的扩展声明和运行时文件。

### 📝 使用方式

#### 1. 注册事件类型

使用泛型语法：
```typescript
import { registerEvent } from "../decorator/Decorate";

// 泛型语法：registerEvent<函数类型>("事件 ID")
registerEvent<(data: string) => void>("CUSTOM_EVENT");
registerEvent<(userId: number, username: string) => void>("PLAYER_LOGIN");
registerEvent<() => void>("GAME_START");
registerEvent<(data: number) => boolean>("MY_TEST");

// 或使用 xxx.ID 格式
registerEvent<(data: string) => void>(GameEvents.CUSTOM_EVENT);
```

#### 2. 运行生成命令
```bash
npm run generate-event-type
```

#### 3. 生成的文件

**GenerateEventExtend.d.ts**:
```typescript
import type { GameEvents } from "../../Extend/Base/Events";

declare module "../../Extend/Base/Events" {
    interface ICustomEventsExtend {
        "CUSTOM_EVENT": "CUSTOM_EVENT";
        "PLAYER_LOGIN": "PLAYER_LOGIN";
        "GAME_START": "GAME_START";
        "MY_TEST": "MY_TEST";
    }

    interface ICustomEvents {
        [GameEvents.CUSTOM_EVENT]: (data: string) => void;
        [GameEvents.PLAYER_LOGIN]: (userId: number, username: string) => void;
        [GameEvents.GAME_START]: () => void;
        [GameEvents.MY_TEST]: (data: number) => boolean;
    }
}
```

**GenerateEventsExtend.ts**:
```typescript
import { GameEvents } from "../Extend/Base/Events";

const eventIds = ["CUSTOM_EVENT", "PLAYER_LOGIN", "GAME_START", "MY_TEST"];

// 注册GameEvents
for (const eventId of eventIds) {
    GameEvents[eventId] = eventId;
}
```

### ✅ 特性
- 支持泛型语法 `registerEvent<类型>("id")`
- 智能检测并忽略被注释的调用
- 支持字符串和 `GameEvents.xxx` 格式
- 自动生成类型安全的回调签名
- 同时生成类型声明和运行时映射
- 使用数组和循环优化代码结构

### 🎯 使用示例

```typescript
import { Dispatch } from "./core/Dispatch";
import { GameEvents } from "./Extend/Base/Events";

// 注册事件监听（类型安全）
Dispatch.on(GameEvents.CUSTOM_EVENT, (data) => {
    // data 被推断为 string 类型
    console.log(data.toUpperCase());
}, this);

Dispatch.on(GameEvents.PLAYER_LOGIN, (userId, username) => {
    // userId: number, username: string
    console.log(`Player ${username} logged in`);
}, this);

// 触发事件
Dispatch.emit(GameEvents.CUSTOM_EVENT, "hello");
Dispatch.emit(GameEvents.PLAYER_LOGIN, 123, "player1");
```

---

## 4️⃣ generate-bundle-map.js - Bundle 资源包类型生成器

### 📌 功能说明
自动扫描项目中所有 `registerBundle` 调用，生成 Bundle 资源包的类型扩展声明。

### 📝 使用方式

#### 1. 注册 Bundle
```typescript
import { registerBundle } from "./Bundles";

// 注册资源包
registerBundle("fight");
registerBundle("ui");
registerBundle("audio");

// 或使用 xxx.ID 格式
registerBundle(bundxxx.Fight);
```

#### 2. 运行生成命令
```bash
npm run generate-bundle-map
```

#### 3. 生成的文件

**GenerateBundleExtend.d.ts**:
```typescript
import type { Bundles } from "../../Extend/Base/Bundles";

declare module "../../Extend/Base/Bundles" {
    interface IBundleIdExtend {
        fight: "fight";
        ui: "ui";
        audio: "audio";
    }
}
```

### ✅ 特性
- 自动识别有效的 `registerBundle` 调用
- 智能检测并忽略被注释的调用
- 支持字符串字面量（单引号、双引号、反引号）
- 支持 `xxx.ID` 格式

---

## 5️⃣ generate-app-extend.js - 应用扩展类型生成器

### 📌 功能说明
自动扫描项目中所有 `registerApp` 调用，生成 `IAppExtend` 接口扩展的类型声明文件。

### 📝 使用方式

#### 1. 注册应用扩展
```typescript
import { registerApp } from "../decorator/Decorate";

// 注册单例应用
registerApp("userManager", UserManager);
registerApp("configManager", ConfigManager);
```

#### 2. 运行生成命令
```bash
npm run generate-app-extend
```

#### 3. 生成的文件
**GenerateAppExtend.d.ts**:
```typescript
declare module "../decorator/Decorate" {
    interface IAppExtend {
        userManager: typeof UserManager;
        configManager: typeof ConfigManager;
    }
}
```

### ✅ 特性
- 自动识别有效的 `registerApp` 调用
- 智能检测并忽略被注释的调用（支持 `//` 和 `/* */`）
- 支持 TypeScript 类型检查和智能提示

---

## 🔧 配置和使用

### 1. package.json 配置

所有插件命令已配置在 `package.json` 中：

```json
{
  "scripts": {
    "generate-view-map": "node plugin/generate-view-map.js",
    "generate-ctrl-map": "node plugin/generate-ctrl-map.js",
    "generate-event-type": "node plugin/generate-event-type.js",
    "generate-bundle-map": "node plugin/generate-bundle-map.js",
    "generate-app-extend": "node plugin/generate-app-extend.js",
    "all": "node plugin/generate-view-map.js && node plugin/generate-ctrl-map.js && node plugin/generate-event-type.js && node plugin/generate-bundle-map.js && node plugin/generate-app-extend.js"
  }
}
```

### 2. 手动运行

```bash
# 运行单个生成器
npm run generate-view-map
npm run generate-ctrl-map
npm run generate-event-type
npm run generate-bundle-map
npm run generate-app-extend

# 运行所有生成器（推荐）
npm run all
```

### 3. 自动化建议

#### 方案 A：构建前运行
在 `package.json` 中添加构建前钩子：
```json
{
  "scripts": {
    "prebuild": "npm run all",
    "build": "tsc"
  }
}
```

#### 方案 B：Git 提交前运行
创建 `.git/hooks/pre-commit` 文件：
```bash
#!/bin/bash
npm run all
git add assets/Script/types/
```

---

## ⚠️ 注意事项

### 1. 注释检测
所有生成器都会自动检测并忽略被注释的调用：

```typescript
// ✅ 会被识别
registerBundle("fight");

// ❌ 不会被识别（被注释）
// registerBundle("commented");

/*
registerBundle("multi-line-commented");
*/
```

### 2. 命名规范
所有 ID 必须遵循 TypeScript 标识符命名规则：
- 可以包含：字母、数字、下划线、$
- 不能以数字开头
- 不能使用保留字

### 3. 文件位置
生成的文件位于：
- `assets/Script/types/d.ts/` - `.d.ts` 类型声明文件
- `assets/Script/types/` - `.ts` 运行时文件

### 4. 运行顺序
`npm run all` 命令会按以下顺序执行：
1. `generate-view-map`
2. `generate-ctrl-map`
3. `generate-event-type`
4. `generate-bundle-map`
5. `generate-app-extend`

### 5. 装饰器位置
所有装饰器和注册函数统一从 `Extend/decorator/Decorate.ts` 导入：
```typescript
import { registerEvent, registerCtrlId, registerApp, registerView } from "../decorator/Decorate";
```

---

## 📚 常见问题

### Q1: 生成的文件没有更新？
**A**: 确保已保存所有源文件，然后重新运行生成命令。

### Q2: TypeScript 报错找不到类型？
**A**: 检查生成的 `.d.ts` 文件是否正确导入，确保 `tsconfig.json` 包含了 `types` 目录。

### Q3: 如何调试生成器？
**A**: 在命令行中直接运行 `node plugin/xxx.js` 查看详细输出日志。

### Q4: 可以自定义生成器吗？
**A**: 可以，参考现有生成器的实现，修改正则表达式和生成逻辑即可。

### Q5: 支持哪些语法格式？
**A**: 
- `registerBundle`: 支持字符串和 `xxx.ID` 格式
- `registerEvent`: 支持泛型语法，支持字符串和 `GameEvents.xxx` 格式
- `@registerCtrlId`: 支持字符串和 `CtrlId.xxx` 格式
- `registerView`: 支持装饰器和函数调用形式，支持字符串和 `UiId.xxx` 格式

---

## 📖 相关文档

- [TypeScript 声明合并](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [TypeScript 模块扩展](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [装饰器模式](https://www.typescriptlang.org/docs/handbook/decorators.html)

---

## 🎯 最佳实践

1. **及时运行生成器**：每次添加新的注册调用后，立即运行相应的生成器
2. **版本控制**：将生成的文件提交到版本控制系统（`.gitignore` 已配置自动生成文件的忽略规则）
3. **代码审查**：检查生成的文件是否符合预期
4. **自动化**：在 CI/CD 流程中集成生成器运行步骤
5. **文档化**：在团队内部文档中说明生成器的使用方法
6. **使用统一命令**：推荐使用 `npm run all` 一次性运行所有生成器

---

**最后更新**: 2026-03-14  
**维护者**: yyd