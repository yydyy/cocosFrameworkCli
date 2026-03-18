# Cocos Framework CLI - 完整方案

## 项目结构

```
cocosFrameworkCli/
├── package.json              # npm 包配置
├── tsconfig.json            # TypeScript 配置
├── README.md                # 使用说明
├── MIGRATION_GUIDE.md       # 迁移指南
├── setup-template.ps1       # 模板设置脚本 (Windows)
├── setup-template.sh        # 模板设置脚本 (Linux/Mac)
├── scripts/
│   └── postinstall.js       # 安装后自动执行
├── dist/
│   └── cli.js              # CLI 工具主入口
└── template/               # 框架模板（需要生成）
    ├── scriptCodes/
    ├── Script/
    ├── plugin/
    ├── tsconfig.json
    └── package.json
```

## 使用流程

### 1. 准备框架模板

在 `cocosFrameworkCli` 目录运行：

**Windows:**
```powershell
.\setup-template.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-template.sh
./setup-template.sh
```

这会将 `cocosTools` 中的框架文件复制到 `template` 目录。

### 2. 发布到 npm

```bash
cd cocosFrameworkCli

# 登录 npm（首次需要）
npm login

# 发布
npm publish

# 或发布测试版
npm publish --tag beta
```

### 3. 在新项目中使用

```bash
# 创建新的 Cocos Creator 项目
mkdir my-cocos-project
cd my-cocos-project

# 安装框架
npm install cocos-framework-cli

# 安装完成后，框架文件会自动拷贝到项目中
```

### 4. 使用 CLI 工具

```bash
# 查看帮助
npx cocos-framework --help

# 添加新管理器
npx cocos-framework add-manager MyCustomMgr

# 列出管理器
npx cocos-framework list-managers

# 清理临时文件
npx cocos-framework clean
```

## 核心功能

### 自动文件拷贝

`postinstall.js` 会在 `npm install` 时自动执行：

1. **拷贝框架文件**
   - `scriptCodes/` → 核心插件
   - `assets/Script/Extend/` → 扩展模块
   - `assets/Script/App.ts` → App 入口
   - `assets/Script/bootstrap.ts` → 启动引导
   - `assets/Script/global.d.ts` → 全局类型
   - `assets/Script/types/` → 类型定义
   - `plugin/` → 生成脚本

2. **合并配置文件**
   - `tsconfig.json` - TypeScript 配置
   - `package.json` - 项目配置

3. **更新 .gitignore**
   - 添加框架相关的忽略规则

### CLI 命令

| 命令 | 说明 |
|------|------|
| `install` | 安装框架到当前项目 |
| `update` | 更新框架版本 |
| `add-manager <name>` | 添加新的管理器 |
| `list-managers` | 列出所有管理器 |
| `clean` | 清理临时文件 |

## 框架特性

### 1. 完整的 TypeScript 支持

- ✅ 智能类型推断
- ✅ 装饰器支持
- ✅ 模块 augmentation
- ✅ 全局类型声明

### 2. 强大的管理器系统

```typescript
// 创建管理器
@$gb.Identifiable
class _MyMgr {
    doSomething() { }
}

export const MyMgr = $gb.SingletonProxy(_MyMgr)
$gb.registerApp("myMgr", MyMgr)

// 使用
$app.myMgr.doSomething()
```

### 3. 自动化类型生成

```bash
# 生成所有类型声明
npm run generate-app-extend
npm run generate-ctrl-map
npm run generate-event-type
npm run generate-view-map
npm run generate-bundle-map
```

### 4. 代码检查

```bash
# 检查导入规范
npm run check-imports
```

## 依赖说明

### 运行时依赖

```json
{
    "chalk": "^4.1.2",        // 彩色终端输出
    "commander": "^9.4.1",    // CLI 框架
    "fs-extra": "^10.1.0",    // 文件系统操作
    "inquirer": "^8.2.5"      // 交互式问答
}
```

### 开发依赖

```json
{
    "@types/fs-extra": "^9.0.13",
    "@types/inquirer": "^8.2.5",
    "@types/node": "^18.11.9",
    "typescript": "^4.9.5"
}
```

## 版本管理

### 语义化版本

- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- MAJOR: 不兼容的 API 变更
- MINOR: 向后兼容的功能新增
- PATCH: 向后兼容的问题修复

### 发布流程

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 发布
npm publish

# 推送 git 标签
git push --follow-tags
```

## 故障排除

### 问题 1: 安装后文件缺失

检查 `postinstall.js` 是否执行：
```bash
npm run postinstall
```

### 问题 2: CLI 命令不可用

确保 CLI 已正确链接：
```bash
npm link
cocos-framework --help
```

### 问题 3: TypeScript 编译错误

检查 TypeScript 版本和配置：
```bash
npx tsc --version
npx tsc --noEmit
```

## 未来规划

### 短期目标

- [ ] 添加交互式安装向导
- [ ] 支持选择性安装模块
- [ ] 添加单元测试
- [ ] 完善文档

### 长期目标

- [ ] 支持 Cocos Creator 3.x
- [ ] 添加 GUI 管理界面
- [ ] 提供插件市场
- [ ] 支持自定义模板

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

- Author: yyd
- Email: 137138329@qq.com

---

**Happy Coding! 🚀**
