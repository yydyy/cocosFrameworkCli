# Cocos Framework CLI

🚀 一键将完整的 Cocos Creator 框架集成到你的项目中 - 支持跨平台自动化安装

## 功能特性

- ✅ **跨平台支持** - Windows/macOS/Linux 统一命令
- ✅ **一键安装** - 自动化复制框架文件到目标项目
- ✅ **配置化管理** - 支持保存配置，快速部署
- ✅ **智能备份** - 自动备份原有文件
- ✅ **完整架构** - 包含管理器、装饰器、扩展模块
- ✅ **TypeScript 支持** - 完整的类型定义
- ✅ **CLI 工具** - 命令行管理框架

## 快速开始

### 方式一：作为 npm 包安装（推荐）

```bash
# 安装到 Cocos Creator 项目
npm install cocos-framework-cli
```

### 方式二：直接使用（开发模式）

```bash
# 1. 克隆项目
git clone https://github.com/yydyy/cocosFrameworkCli.git

# 2. 安装依赖
npm install

# 3. 设置模板（首次使用）
npm run setup

# 4. 安装到目标项目
npm run install-framework -- --target=/path/to/your/project --save-config
```

## 命令说明

### 核心命令

```bash
# 设置框架模板（从 cocosTools 复制）
npm run setup

# 安装框架到目标项目
npm run install-framework

# 查看帮助
npm run install-framework -- --help
```

### 安装选项

```bash
# 交互式安装
npm run install-framework

# 指定目标路径
npm run install-framework -- --target=D:\Projects\MyGame

# 非交互式安装
npm run install-framework -- --target=D:\Projects\MyGame --yes

# 使用保存的配置
npm run install-framework -- --use-config
```

## 框架组成

```
project/
├── scriptCodes/              # 核心插件（webpack 打包）
│   ├── src/
│   │   ├── decorators/       # 装饰器
│   │   ├── extensions/       # 扩展模块
│   │   └── core/            # 核心功能
│   └── package.json
├── assets/
│   └── Script/
│       ├── Extend/          # 扩展模块
│       │   ├── mgr/         # 管理器
│       │   ├── core/        # 核心功能
│       │   └── base/        # 基类
│       ├── App.ts           # App 入口
│       ├── bootstrap.ts     # 启动引导
│       ├── global.d.ts      # 全局类型
│       └── types/           # 类型定义
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目配置
```

## 架构说明

### 核心概念

1. **$gb (Global Base)** - 全局基础对象
   - 提供所有装饰器和注册函数
   - 在 scriptCodes 中定义

2. **$app** - 应用管理器
   - 统一管理所有业务管理器
   - 通过 `registerApp` 动态扩展

3. **装饰器系统**
   - `@Identifiable` - 唯一 ID
   - `@SingletonProxy` - 单例模式
   - `registerCtrlId` - 控制器注册
   - `registerEvent` - 事件注册

### 使用示例

```typescript
// 创建管理器
import { SingletonProxy } from './decorators/Singleton'

@$gb.Identifiable
class _MyMgr {
    public doSomething() {
        console.log('Doing something...')
    }
}

export const MyMgr = $gb.SingletonProxy(_MyMgr)
$gb.registerApp("myMgr", MyMgr)

// 使用管理器
$app.myMgr.doSomething()
```

## 开发指南

### 添加新管理器

1. 使用 CLI 创建：
```bash
npx cocos-framework add-manager MyMgr
```

2. 手动创建：
```typescript
// assets/Script/Extend/mgr/MyMgr.ts
@$gb.Identifiable
class _MyMgr {
    // 业务逻辑
}

export const MyMgr = $gb.SingletonProxy(_MyMgr)
$gb.registerApp("myMgr", MyMgr)
```

3. 在 App.ts 中添加 getter：
```typescript
class App {
    get myMgr() {
        return MyMgr.Ins()
    }
}
```

4. 更新类型声明：
```bash
npm run generate-app-extend
```

## 配置说明

### tsconfig.json

框架会自动合并以下配置：

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "skipLibCheck": true
    },
    "include": [
        "assets/Script/**/*"
    ]
}
```

### package.json

框架会添加以下脚本：

```json
{
    "scripts": {
        "generate-app-extend": "node plugin/generate-app-extend.js",
        "generate-ctrl-map": "node plugin/generate-ctrl-map.js",
        "generate-event-type": "node plugin/generate-event-type.js",
        "generate-view-map": "node plugin/generate-view-map.js",
        "generate-bundle-map": "node plugin/generate-bundle-map.js"
    }
}
```

## 常见问题

### Q: 如何更新框架？

```bash
npm update cocos-framework-cli
```

### Q: 可以只使用部分功能吗？

可以，安装后删除不需要的目录即可。

### Q: 支持 Cocos Creator 哪个版本？

支持 Cocos Creator 2.4.x

## License

MIT
