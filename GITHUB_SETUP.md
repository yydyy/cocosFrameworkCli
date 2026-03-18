# 推送到 GitHub 指南

## 已完成的工作

✅ Git 仓库已初始化
✅ 首次提交已完成
✅ .gitignore 已创建
✅ 所有必要文件已添加

## 推送到 GitHub 的步骤

### 方式一：使用 HTTPS（推荐新手）

#### 1. 在 GitHub 创建新仓库

访问 https://github.com/new
- 仓库名：`cocos-framework-cli`
- 描述：`跨平台 Cocos Creator 框架 CLI 工具 - 一键安装框架到项目`
- 公开/私有：根据你的需求选择
- **不要**勾选 "Initialize this repository with a README"（我们已经有了）
- 点击 "Create repository"

#### 2. 推送代码到 GitHub

```bash
# 添加远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/cocos-framework-cli.git

# 推送到 GitHub
git push -u origin master
```

#### 3. 验证推送

访问你的 GitHub 仓库页面，确认文件已上传成功。

---

### 方式二：使用 SSH（推荐经常使用 Git 的用户）

#### 1. 生成 SSH 密钥（如果还没有）

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

#### 2. 添加 SSH 密钥到 GitHub

```bash
# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

复制输出的内容，然后：
- 访问 https://github.com/settings/keys
- 点击 "New SSH key"
- 粘贴公钥内容
- 点击 "Add SSH key"

#### 3. 创建 GitHub 仓库并推送

```bash
# 在 GitHub 创建仓库后（参考方式一的步骤 1）

# 添加远程仓库
git remote add origin git@github.com:YOUR_USERNAME/cocos-framework-cli.git

# 推送到 GitHub
git push -u origin master
```

---

## 后续开发流程

### 日常开发

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature-name

# 2. 进行修改并提交
git add .
git commit -m "feat: 添加新功能"

# 3. 推送到远程分支
git push origin feature/your-feature-name

# 4. 在 GitHub 创建 Pull Request
```

### 更新主分支

```bash
# 切换回主分支
git checkout master

# 拉取最新代码
git pull origin master

# 合并功能分支
git merge feature/your-feature-name

# 推送到 GitHub
git push origin master
```

---

## 发布到 npm（可选）

如果你想将这个工具发布到 npm：

### 1. 准备 npm 账号

```bash
# 登录 npm
npm login
```

### 2. 更新 package.json

确保 `package.json` 中的信息正确：
- `name`: 包名（必须是唯一的）
- `version`: 版本号（遵循语义化版本）
- `repository`: GitHub 仓库地址
- `author`: 作者信息

### 3. 发布

```bash
# 构建项目
npm run build

# 发布到 npm
npm publish
```

### 4. 更新版本

```bash
# 更新版本号（patch/minor/major）
npm version patch

# 推送到 GitHub（包括 tag）
git push origin master --tags

# 重新发布
npm publish
```

---

## 常见问题

### Q: 推送时提示权限错误？
A: 检查远程仓库地址是否正确，或者使用 SSH 方式。

### Q: 如何修改远程仓库地址？
A: 
```bash
git remote set-url origin https://github.com/NEW_USERNAME/NEW_REPO.git
```

### Q: 如何查看远程仓库地址？
A:
```bash
git remote -v
```

### Q: 推送失败，提示非快进合并？
A:
```bash
# 先拉取最新代码
git pull origin master

# 解决冲突后再次推送
git push origin master
```

---

## 下一步

1. ✅ 推送到 GitHub
2. ✅ 更新 README.md 中的 GitHub 链接
3. ✅ 添加 GitHub Actions CI/CD（可选）
4. ✅ 发布到 npm（可选）
5. ✅ 分享给其他人使用！

祝你好运！🚀
