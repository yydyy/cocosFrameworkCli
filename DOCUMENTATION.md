# Cocos Framework CLI - 完整文档

🚀 **跨平台 Cocos Creator 框架 CLI 工具 - 一键安装框架到项目**

---

## 📑 目录

1. [项目简介](#项目简介)
2. [功能特性](#功能特性)
3. [快速开始](#快速开始)
4. [安装指南](#安装指南)
5. [使用指南](#使用指南)
6. [命令说明](#命令说明)
7. [框架架构](#框架架构)
8. [开发指南](#开发指南)
9. [配置说明](#配置说明)
10. [常见问题](#常见问题)
11. [贡献指南](#贡献指南)
12. [GitHub 推送指南](#github 推送指南)

---

## 项目简介

Cocos Framework CLI 是一个跨平台的命令行工具，用于将完整的 Cocos Creator 框架快速集成到你的项目中。它支持 Windows、macOS 和 Linux，提供一键安装、配置化管理和智能备份等功能。

### 核心价值
- **跨平台支持** - 统一命令在所有主流操作系统上运行
- **一键安装** - 自动化复制框架文件到目标项目
- **配置化管理** - 支持保存配置，快速部署
- **智能备份** - 自动备份原有文件
- **完整架构** - 包含管理器、装饰器、扩展模块
- **TypeScript 支持** - 完整的类型定义

---

## 功能特性

- ✅ **跨平台支持** - Windows/macOS/Linux 统一命令
- ✅ **一键安装** - 自动化复制框架文件到目标项目
- ✅ **配置化管理** - 支持保存配置，快速部署
- ✅ **智能备份** - 自动备份原有文件（添加 `.backup.时间戳` 后缀）
- ✅ **完整架构** - 包含管理器、装饰器、扩展模块
- ✅ **TypeScript 支持** - 完整的类型定义
- ✅ **CLI 工具** - 命令行管理框架
- ✅ **装饰器系统** - 优雅的装饰器 API
- ✅ **单例模式** - 内置单例代理
- ✅ **事件系统** - 类型安全的事件注册

---

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

### 5 分钟快速打包

```bash
# 设置模板
.\setup-template.ps1  # Windows
./setup-template.sh   # Linux/Mac

# 构建 CLI
npm install
npm run build

# 本地测试
npm link

# 发布到 npm
npm login
npm publish
```

---

## 安装指南

### 系统要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- Cocos Creator 2.4.x

### 安装步骤

#### 1. 设置模板（首次使用）

```bash
npm run setup
```

这会从 cocosTools 复制框架文件到本地 `template` 目录。

**配置文件**: `setup-config.json`
```json
{
  "cocosToolsPath": {
    "windows": "D:\\Documents\\cocostools\\cocosTools",
    "darwin": "/Users/yourname/Documents/cocostools/cocosTools",
    "linux": "/home/yourname/cocostools/cocosTools"
  }
}
```

#### 2. 安装框架到项目

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

#### 3. 安装后操作

```bash
# 1. 安装依赖
npm install

# 2. 生成扩展文件
npm run generate-app-extend
npm run generate-ctrl-map
npm run generate-view-map
npm run generate-event-type

# 3. 打开 Cocos Creator 并刷新项目
```

### 验证清单

安装后检查以下内容：

- [ ] `scriptCodes/` 目录存在
- [ ] `assets/Script/Extend/` 目录存在  
- [ ] `assets/Script/App.ts` 存在
- [ ] `assets/Script/global.d.ts` 存在
- [ ] `plugin/` 目录存在
- [ ] `tsconfig.json` 已更新
- [ ] `package.json` 已添加脚本
- [ ] `.gitignore` 已更新

---

## 使用指南

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

# 保存配置供下次使用
npm run install-framework -- --save-config
```

### 完整工作流

#### 首次使用

```bash
# 1. 设置模板（只需一次）
npm run setup

# 2. 安装到项目
npm run install-framework -- --target=D:\Projects\MyGame --save-config
```

#### 日常使用

```bash
# 使用保存的配置快速安装
npm run install-framework -- --use-config
```

#### 更新框架

```bash
# 1. 重新设置模板（从 cocosTools 更新）
npm run setup

# 2. 重新安装到项目
npm run install-framework -- --use-config --yes
```

---

## 命令说明

### npm 脚本命令

```bash
# 核心命令
npm run setup              # 设置框架模板
npm run install-framework  # 安装框架到项目

# 构建命令
npm run build             # 编译 TypeScript
npm run watch             # 监听模式
npm run build-script      # 构建 scriptCodes

# 生成命令
npm run generate-app-extend    # 生成 App 扩展
npm run generate-ctrl-map      # 生成控制器映射
npm run generate-event-type    # 生成事件类型
npm run generate-view-map      # 生成视图映射
npm run generate-bundle-map    # 生成资源包映射

# 工具命令
npm run check-imports       # 检查导入
npm run postinstall         # 安装后脚本
```

### CLI 命令

```bash
# 查看帮助
npx cocos-framework --help

# 添加管理器
npx cocos-framework add-manager MyMgr

# 列出管理器
npx cocos-framework list-managers

# 清理临时文件
npx cocos-framework clean
```

---

## 框架架构

### 目录结构

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
│       │   ├── base/        # 基类
│       │   ├── utils/       # 工具类
│       │   └── ui/          # UI 组件
│       ├── App.ts           # App 入口
│       ├── bootstrap.ts     # 启动引导
│       ├── global.d.ts      # 全局类型
│       └── types/           # 类型定义
├── plugin/                  # 编辑器插件
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目配置
```

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

---

## 开发指南

### 添加新管理器

#### 方法 1：使用 CLI 创建

```bash
npx cocos-framework add-manager MyMgr
```

#### 方法 2：手动创建

```typescript
// assets/Script/Extend/mgr/MyMgr.ts
@$gb.Identifiable
class _MyMgr {
    // 业务逻辑
}

export const MyMgr = $gb.SingletonProxy(_MyMgr)
$gb.registerApp("myMgr", MyMgr)
```

#### 更新类型声明

```bash
npm run generate-app-extend
```

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/yydyy/cocosFrameworkCli.git
cd cocosFrameworkCli

# 安装依赖
npm install

# 构建项目
npm run build

# 监听模式
npm run watch
```

### 提交代码规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: 添加新的管理器类型
fix: 修复跨平台路径问题
docs: 更新安装说明
```

---

## 配置说明

### setup-config.json

cocosTools 路径配置（跨平台）：

```json
{
  "cocosToolsPath": {
    "windows": "D:\\Documents\\cocostools\\cocosTools",
    "darwin": "/Users/yourname/Documents/cocostools/cocosTools",
    "linux": "/home/yourname/cocostools/cocosTools"
  },
  "targetProjectPath": ""
}
```

### install-config.json

目标项目路径配置（自动创建）：

```json
{
  "targetProjectPath": "D:\\Projects\\MyGame",
  "lastUpdated": "2026-03-18T00:00:00.000Z"
}
```

### tsconfig.json

框架会自动合并以下配置：

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "typeRoots": [
      "./node_modules/@types",
      "./assets/Script/types/d.ts"
    ]
  },
  "include": [
    "assets/Script/**/*"
  ],
  "exclude": [
    "node_modules",
    "library",
    "local",
    "temp",
    "build",
    "settings",
    "scriptCodes"
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
    "generate-bundle-map": "node plugin/generate-bundle-map.js",
    "check-imports": "node plugin/check-imports.js",
    "build-script": "cd scriptCodes && npm run build"
  }
}
```

---

## 常见问题

### Q: 如何备份原有文件？
A: 安装脚本会自动备份原有文件，添加 `.backup.时间戳` 后缀。

### Q: 如何恢复到原始状态？
A: 删除安装的文件，恢复备份文件即可。

### Q: 可以在多个项目中使用吗？
A: 可以，每次运行 `install-framework` 时指定不同的 `--target` 路径。

### Q: 如何更新框架？
A: 重新运行 `npm run setup` 更新模板，然后运行 `npm run install-framework` 安装到项目。

### Q: postinstall 没有执行？
A: 手动执行 `npm run postinstall`

### Q: CLI 命令找不到？
A: 重新链接：
```bash
npm unlink -g
npm link
```

### Q: 文件冲突？
A: 使用强制覆盖：
```bash
npm install cocos-framework-cli --force
```

### Q: 推送时提示权限错误？
A: 检查远程仓库地址是否正确，或者使用 SSH 方式。

### Q: 推送失败，提示非快进合并？
A:
```bash
# 先拉取最新代码
git pull origin master

# 解决冲突后再次推送
git push origin master
```

---

## 贡献指南

### 开发流程

```bash
# 1. 创建分支
git checkout -b feature/your-feature-name

# 2. 进行修改
# 运行 npm run watch 监听编译
# 测试你的修改

# 3. 提交代码
git add .
git commit -m "feat: add your feature description"

# 4. 推送并创建 PR
git push origin feature/your-feature-name
```

### 发布新版本

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 发布到 npm
npm publish

# 3. 创建 GitHub Release
到 GitHub Releases 页面创建新的 Release
```

### 问题反馈

遇到问题？请提交 [Issue](https://github.com/yydyy/cocosFrameworkCli/issues)。

---

## GitHub 推送指南

### 方式一：使用 HTTPS（推荐新手）

```bash
# 添加远程仓库
git remote add origin https://github.com/yydyy/cocosFrameworkCli.git

# 推送到 GitHub
git push -u origin master
```

### 方式二：使用 SSH（推荐经常使用 Git 的用户）

```bash
# 生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 添加 SSH 密钥到 GitHub
# 访问 https://github.com/settings/keys

# 添加远程仓库
git remote add origin git@github.com:yydyy/cocosFrameworkCli.git

# 推送到 GitHub
git push -u origin master
```

### 常用 Git 命令

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v

# 添加文件
git add <文件名>

# 提交
git commit -m "描述"

# 推送
git push origin master

# 拉取
git pull origin master
```

---

## 相关链接

- **GitHub 仓库**: https://github.com/yydyy/cocosFrameworkCli
- **GitHub Issues**: https://github.com/yydyy/cocosFrameworkCli/issues
- **npm 包**: https://www.npmjs.com/package/cocos-framework-cli

---

## 下一步建议

### 1. 完善 GitHub 仓库页面
- [ ] 添加仓库描述：`跨平台 Cocos Creator 框架 CLI 工具 - 一键安装框架到项目`
- [ ] 添加主题标签：`cocos`, `cocos-creator`, `cli`, `typescript`, `framework`
- [ ] 设置仓库网站（如果有）
- [ ] 添加 GitHub Actions CI/CD（可选）

### 2. 发布到 npm（可选）
```bash
# 登录 npm
npm login

# 构建项目
npm run build

# 发布
npm publish
```

### 3. 推广项目
- [ ] 分享给团队成员
- [ ] 发布到 Cocos Creator 官方论坛
- [ ] 添加到相关 Awesome 列表
- [ ] 编写博客文章介绍

---

## 仓库统计

- **提交数**: 5+
- **文件数**: 20+
- **代码行数**: 1000+
- **支持平台**: Windows, macOS, Linux

---

**🎉 恭喜！你已经掌握了 Cocos Framework CLI 的完整使用方法！**

如有问题，请查看：
- [GitHub Issues](https://github.com/yydyy/cocosFrameworkCli/issues)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

---

MIT License - Copyright (c) 2026 Cocos Framework CLI
