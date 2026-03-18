# 快速开始 - 5 分钟将框架打包成 npm 工具

## 前提条件

- Node.js >= 14.0.0
- npm >= 6.0.0
- Cocos Creator 2.4.x

## 步骤 1: 准备模板文件

在 `cocosFrameworkCli` 目录运行设置脚本：

**Windows:**
```powershell
.\setup-template.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-template.sh
./setup-template.sh
```

这会创建 `template` 目录，包含所有需要拷贝到目标项目的文件。

## 步骤 2: 检查模板文件

检查 `template` 目录是否包含：

```
template/
├── scriptCodes/           ✅
├── Script/
│   ├── Extend/           ✅
│   ├── App.ts            ✅
│   ├── bootstrap.ts      ✅
│   ├── global.d.ts       ✅
│   └── types/            ✅
├── plugin/               ✅
├── tsconfig.json         ✅
└── package.json          ✅
```

## 步骤 3: 构建 CLI 工具

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build
```

## 步骤 4: 本地测试

```bash
# 链接到全局
npm link

# 创建测试项目
mkdir test-project
cd test-project

# 初始化 npm 项目
npm init -y

# 安装框架（会触发 postinstall）
npm link cocos-framework-cli

# 检查文件是否已拷贝
ls -la
# 应该看到：scriptCodes/, assets/Script/, tsconfig.json 等
```

## 步骤 5: 测试 CLI 命令

```bash
# 查看帮助
npx cocos-framework --help

# 添加管理器
npx cocos-framework add-manager TestMgr

# 列出管理器
npx cocos-framework list-managers
```

## 步骤 6: 发布到 npm

```bash
# 返回框架目录
cd ..

# 登录 npm（首次需要）
npm login

# 发布
npm publish

# 或发布测试版
npm publish --tag beta
```

## 步骤 7: 在真实项目中使用

```bash
# 进入你的 Cocos Creator 项目
cd /path/to/your/cocos-project

# 安装框架
npm install cocos-framework-cli

# 检查安装结果
ls -la
```

## 验证清单

安装后检查以下内容：

- [ ] `scriptCodes/` 目录存在
- [ ] `assets/Script/Extend/` 目录存在  
- [ ] `assets/Script/App.ts` 存在
- [ ] `assets/Script/global.d.ts` 存在
- [ ] `plugin/` 目录存在
- [ ] `tsconfig.json` 已更新
- [ ] `package.json` 已添加脚本
- [ ] `.gitignore` 已更新

## 常用命令

```bash
# 安装框架
npm install cocos-framework-cli

# 使用 CLI
npx cocos-framework --help
npx cocos-framework add-manager MyMgr
npx cocos-framework list-managers
npx cocos-framework clean

# 生成类型
npm run generate-app-extend
npm run generate-ctrl-map
npm run generate-event-type
npm run generate-view-map
npm run generate-bundle-map

# 构建 scriptCodes
npm run build-script

# 检查导入
npm run check-imports
```

## 故障排除

### 问题：postinstall 没有执行

手动执行：
```bash
npm run postinstall
```

### 问题：CLI 命令找不到

重新链接：
```bash
npm unlink -g
npm link
```

### 问题：文件冲突

使用强制覆盖：
```bash
npm install cocos-framework-cli --force
```

## 下一步

1. 阅读 [README.md](./README.md) 了解详细功能
2. 阅读 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) 了解迁移细节
3. 阅读 [COMPLETE_SOLUTION.md](./COMPLETE_SOLUTION.md) 了解完整方案

---

**恭喜！你的框架已经打包成 npm 工具了！🎉**
