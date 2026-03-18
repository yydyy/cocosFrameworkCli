# Cocos Framework CLI 使用指南

## 快速开始

### 1. 设置模板（首次使用）

运行一次即可将 cocosTools 的框架文件复制到 template 目录：

```bash
npm run setup
```

**配置文件**: `setup-config.json`
- 支持跨平台配置（Windows/macOS/Linux）
- 自动根据操作系统选择对应路径

### 2. 安装框架到项目

将 template 目录的框架文件复制到目标 Cocos Creator 项目：

```bash
# 交互式安装（推荐）
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

**配置文件**: `install-config.json`（自动创建）
- 保存目标项目路径
- 下次可使用 `--use-config` 快速安装

## 命令说明

### `npm run setup`

设置框架模板，从 cocosTools 复制文件到本地 template 目录。

**选项**：
- 自动读取 `setup-config.json` 配置
- 支持跨平台路径配置

**配置文件**：
```json
{
  "cocosToolsPath": {
    "windows": "D:\\Documents\\cocostools\\cocosTools",
    "darwin": "/Users/yourname/Documents/cocostools/cocosTools",
    "linux": "/home/yourname/cocostools/cocosTools"
  }
}
```

### `npm run install-framework`

安装框架到目标 Cocos Creator 项目。

**选项**：
- `--target=<路径>` - 指定目标项目路径
- `--use-config` - 使用保存的配置
- `--save-config` - 保存当前配置
- `--yes, -y` - 跳过确认提示
- `--help, -h` - 显示帮助信息

**安装内容**：
- `assets/Script/` - 框架核心脚本
- `scriptCodes/` - 扩展代码库
- `plugin/` - 编辑器插件
- `tsconfig.json` - TypeScript 配置
- `package.json` - 添加必要的 scripts

**安装后操作**：
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

## 完整工作流

### 首次使用

```bash
# 1. 设置模板（只需一次）
npm run setup

# 2. 安装到项目
npm run install-framework -- --target=D:\Projects\MyGame --save-config
```

### 日常使用

```bash
# 使用保存的配置快速安装
npm run install-framework -- --use-config
```

### 更新框架

```bash
# 1. 重新设置模板（从 cocosTools 更新）
npm run setup

# 2. 重新安装到项目
npm run install-framework -- --use-config --yes
```

## 配置说明

### setup-config.json

 cocosTools 路径配置（跨平台）：

```json
{
  "cocosToolsPath": {
    "windows": "路径",
    "darwin": "路径",
    "linux": "路径"
  }
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

## 常见问题

### Q: 如何备份原有文件？
A: 安装脚本会自动备份原有文件，添加 `.backup.时间戳` 后缀。

### Q: 如何恢复到原始状态？
A: 删除安装的文件，恢复备份文件即可。

### Q: 可以在多个项目中使用吗？
A: 可以，每次运行 `install-framework` 时指定不同的 `--target` 路径。

### Q: 如何更新框架？
A: 重新运行 `npm run setup` 更新模板，然后运行 `npm run install-framework` 安装到项目。

## 跨平台支持

- **Windows**: PowerShell 脚本
- **macOS/Linux**: Shell 脚本
- **统一命令**: 所有平台都使用 `npm run setup` 和 `npm run install-framework`
