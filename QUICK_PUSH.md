# 🚀 快速推送到 GitHub

## 当前状态

✅ Git 仓库已初始化  
✅ 首次提交已完成  
✅ 包含 2 个提交记录  
✅ 所有必要文件已添加  

## 一键推送（3 步完成）

### 步骤 1：在 GitHub 创建仓库

访问：https://github.com/new

- **仓库名**: `cocos-framework-cli`
- **描述**: 跨平台 Cocos Creator 框架 CLI 工具
- **可见性**: 公开或私有
- ⚠️ **不要**勾选 "Initialize this repository with a README"
- 点击 **"Create repository"**

### 步骤 2：推送代码

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/cocos-framework-cli.git

# 推送到 GitHub
git push -u origin master
```

### 步骤 3：完成！

访问你的 GitHub 仓库页面查看代码：
```
https://github.com/YOUR_USERNAME/cocos-framework-cli
```

---

## 后续更新 README 中的链接

推送成功后，记得更新以下文件中的 GitHub 链接：

### 1. README.md
```markdown
# 将这一行：
git clone https://github.com/yourname/cocos-framework-cli.git

# 改为：
git clone https://github.com/YOUR_USERNAME/cocos-framework-cli.git
```

### 2. CONTRIBUTING.md
```markdown
# 将这一行：
git clone https://github.com/yourname/cocos-framework-cli.git

# 改为：
git clone https://github.com/YOUR_USERNAME/cocos-framework-cli.git
```

### 3. package.json
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/cocos-framework-cli.git"
  }
}
```

---

## 常用 Git 命令

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

## 需要帮助？

查看详细指南：[`GITHUB_SETUP.md`](./GITHUB_SETUP.md)
