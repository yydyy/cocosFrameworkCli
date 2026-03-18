# 框架迁移指南

本指南帮助你将现有的 cocosTools 项目框架迁移到可复用的 npm 包。

## 迁移步骤

### 1. 准备框架模板

创建 `template` 目录，包含需要拷贝到目标项目的文件：

```
cocosFrameworkCli/
├── template/
│   ├── scriptCodes/              # 从 cocosTools/scriptCodes 复制
│   ├── Script/
│   │   ├── Extend/               # 从 cocosTools/assets/Script/Extend 复制
│   │   ├── App.ts                # 从 cocosTools/assets/Script/App.ts 复制
│   │   ├── bootstrap.ts          # 从 cocosTools/assets/Script/bootstrap.ts 复制
│   │   ├── global.d.ts           # 从 cocosTools/assets/Script/global.d.ts 复制
│   │   └── types/                # 从 cocosTools/assets/Script/types 复制
│   ├── plugin/                   # 生成脚本
│   ├── tsconfig.json            # TypeScript 配置模板
│   └── package.json             # 项目配置模板
├── scripts/
│   └── postinstall.js           # 安装后执行脚本
├── dist/
│   └── cli.js                   # CLI 工具
└── package.json
```

### 2. 创建框架模板文件

#### 2.1 复制核心代码

```bash
# 复制 scriptCodes
cp -r cocosTools/scriptCodes cocosFrameworkCli/template/

# 复制 Extend 目录
cp -r cocosTools/assets/Script/Extend cocosFrameworkCli/template/Script/

# 复制 App.ts
cp cocosTools/assets/Script/App.ts cocosFrameworkCli/template/Script/

# 复制 bootstrap.ts
cp cocosTools/assets/Script/bootstrap.ts cocosFrameworkCli/template/Script/

# 复制 global.d.ts
cp cocosTools/assets/Script/global.d.ts cocosFrameworkCli/template/Script/

# 复制 types 目录
cp -r cocosTools/assets/Script/types cocosFrameworkCli/template/Script/
```

#### 2.2 复制插件脚本

```bash
cp -r cocosTools/plugin cocosFrameworkCli/template/
```

#### 2.3 创建配置模板

**tsconfig.json 模板：**

```json
{
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "outDir": "temp/vscode-dist",
        "skipLibCheck": true,
        "experimentalDecorators": true,
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

**package.json 模板：**

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

### 3. 配置 postinstall 脚本

`postinstall.js` 会在用户执行 `npm install` 时自动运行，将框架文件拷贝到目标项目。

关键点：
- 使用 `process.env.INIT_CWD` 获取目标项目目录
- 智能跳过已存在的文件
- 合并配置文件而不是覆盖

### 4. 发布到 npm

```bash
cd cocosFrameworkCli

# 登录 npm
npm login

# 发布
npm publish

# 如果是测试版本
npm publish --tag beta
```

### 5. 在目标项目中使用

```bash
# 创建新的 Cocos Creator 项目
mkdir my-project
cd my-project

# 安装框架
npm install cocos-framework-cli

# 检查安装结果
ls -la
# 应该看到 scriptCodes, assets/Script 等目录
```

## 注意事项

### 1. 文件冲突处理

- 如果目标项目已存在某些文件，`postinstall.js` 会跳过而不是覆盖
- 配置文件（tsconfig.json, package.json）会智能合并
- 可以在安装时使用 `--force` 参数强制覆盖

### 2. 路径依赖

确保所有路径都是相对的：
- ❌ 错误：`import ... from "D:/Projects/cocosTools/..."`
- ✅ 正确：`import ... from "./Extend/mgr/LoadMgr"`

### 3. 类型声明

- `CoreScripts.d.ts` 应该引用项目中的类型
- 确保 `global.d.ts` 中的路径是正确的相对路径

### 4. 插件脚本

确保插件脚本中的路径是相对于项目根目录的：

```javascript
// ✅ 正确
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ❌ 错误
const PROJECT_ROOT = 'D:/Projects/cocosTools';
```

## 验证清单

安装框架后，检查以下内容：

- [ ] `scriptCodes/` 目录存在
- [ ] `assets/Script/Extend/` 目录存在
- [ ] `assets/Script/App.ts` 存在
- [ ] `assets/Script/global.d.ts` 存在
- [ ] `tsconfig.json` 已更新
- [ ] `package.json` 已添加脚本
- [ ] `.gitignore` 已更新
- [ ] 运行 `npm run build-script` 成功
- [ ] TypeScript 没有报错

## 故障排除

### 问题 1: 安装后找不到文件

检查 `postinstall.js` 是否正确执行：
```bash
npm run postinstall
```

### 问题 2: TypeScript 报错

检查 `tsconfig.json` 的 `include` 和 `exclude` 配置

### 问题 3: 类型识别失败

检查 `global.d.ts` 中的引用路径是否正确

## 后续优化

1. **版本管理**：添加框架版本检查和升级功能
2. **选择性安装**：允许用户选择安装哪些模块
3. **自定义模板**：支持用户自定义模板
4. **迁移向导**：提供交互式安装向导
