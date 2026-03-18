# Contributing to Cocos Framework CLI

感谢你对这个项目的贡献！

## 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/yourname/cocos-framework-cli.git
cd cocos-framework-cli
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建项目

```bash
# 一次性构建
npm run build

# 监听模式
npm run watch
```

## 项目结构

```
cocos-framework-cli/
├── dist/                    # 编译输出
├── scripts/                 # 安装后脚本
├── template/                # 框架模板（自动生成）
├── setup.js                # 跨平台设置脚本
├── install.js              # 跨平台安装脚本
├── setup-config.json       # 路径配置
└── package.json            # 项目配置
```

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 进行修改

- 修改源代码
- 运行 `npm run watch` 监听编译
- 测试你的修改

### 3. 测试

确保你的修改在以下环境测试通过：
- Windows (PowerShell)
- macOS (bash/zsh)
- Linux (bash)

### 4. 提交代码

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

然后到 GitHub 创建 Pull Request。

## 提交信息规范

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

## 发布新版本

### 1. 更新版本号

```bash
npm version patch  # 或 minor, major
```

### 2. 发布到 npm

```bash
npm publish
```

### 3. 创建 GitHub Release

到 GitHub Releases 页面创建新的 Release。

## 问题反馈

遇到问题？请提交 [Issue](https://github.com/yourname/cocos-framework-cli/issues)。

## 许可证

MIT License
