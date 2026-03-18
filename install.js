#!/usr/bin/env node

/**
 * 跨平台框架安装脚本
 * 将 template 目录下的文件复制到目标 Cocos Creator 项目
 * 
 * 用法:
 *   npm run install-framework                      # 交互式安装
 *   npm run install-framework -- --target=路径      # 指定目标路径
 *   npm run install-framework -- --use-config      # 使用保存的配置
 *   npm run install-framework -- --save-config     # 保存配置
 *   npm run install-framework -- --target=路径 --yes  # 非交互式安装
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');

const scriptDir = __dirname;
const templateDir = path.join(scriptDir, 'template');
const configPath = path.join(scriptDir, 'setup-config.json');
const installConfigPath = path.join(scriptDir, 'install-config.json');

// 显示帮助信息
function showHelp() {
    console.log(`
Cocos Framework Installer - 安装框架到 Cocos Creator 项目

用法:
  npm run install-framework [选项]

选项:
  --target=<路径>       指定目标 Cocos Creator 项目路径
  --use-config         使用保存的配置（不询问）
  --save-config        保存当前配置供下次使用
  --yes, -y            跳过确认提示
  --help, -h           显示此帮助信息

示例:
  npm run install-framework
  npm run install-framework -- --target=D:\\Projects\\MyGame
  npm run install-framework -- --target=D:\\Projects\\MyGame --yes
  npm run install-framework -- --use-config
`);
}

// 创建 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 异步提问函数
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// 检查是否是 Cocos Creator 项目
function isCocosProject(targetPath) {
    const requiredFiles = [
        'project.json',
        'assets',
        'settings'
    ];
    
    return requiredFiles.every(file => {
        const fullPath = path.join(targetPath, file);
        return fs.existsSync(fullPath);
    });
}

// 获取模板目录
function getTemplateDir() {
    if (!fs.existsSync(templateDir)) {
        console.error('[ERROR] template directory not found');
        console.error('Please run "npm run setup" first to create template files');
        process.exit(1);
    }
    return templateDir;
}

// 读取安装配置
function readInstallConfig() {
    if (fs.existsSync(installConfigPath)) {
        try {
            return JSON.parse(fs.readFileSync(installConfigPath, 'utf-8'));
        } catch (e) {
            console.warn('[WARN] Failed to parse install-config.json');
            return null;
        }
    }
    return null;
}

// 保存安装配置
function saveInstallConfig(config) {
    fs.writeFileSync(installConfigPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[OK] Configuration saved to install-config.json');
}

// 复制文件
function copyFiles(src, dest) {
    const { copySync } = require('fs-extra');
    
    console.log(`Copying from ${src} to ${dest}...`);
    copySync(src, dest, {
        overwrite: true,
        errorOnExist: false
    });
}

// 主函数
async function main() {
    // 解析命令行参数
    const args = process.argv.slice(2);
    
    // 检查帮助参数
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    console.log('======================================');
    console.log('Cocos Framework Installer');
    console.log('======================================');
    console.log('');

    const platform = os.platform();
    console.log(`Platform: ${platform}`);
    console.log('');

    // 检查模板目录
    const templateDir = getTemplateDir();
    console.log(`Template directory: ${templateDir}`);
    console.log('');

    // 读取安装配置
    const savedConfig = readInstallConfig();
    let targetProjectPath;
    let saveConfig = false;

    // 解析命令行参数
    const targetArg = args.find(arg => arg.startsWith('--target='));
    const useConfigArg = args.includes('--use-config');
    const saveConfigArg = args.includes('--save-config');

    if (targetArg) {
        // 从命令行参数获取目标路径
        targetProjectPath = targetArg.split('=')[1];
        console.log(`Using target path from argument: ${targetProjectPath}`);
    } else if (useConfigArg && savedConfig && savedConfig.targetProjectPath) {
        // 使用保存的配置
        targetProjectPath = savedConfig.targetProjectPath;
        console.log(`Using saved configuration: ${targetProjectPath}`);
    } else if (savedConfig && savedConfig.targetProjectPath) {
        // 有保存的配置，询问是否使用
        console.log(`Found saved target path: ${savedConfig.targetProjectPath}`);
        const useSaved = await askQuestion('Use saved path? (Y/n): ');
        if (useSaved.toLowerCase() !== 'n') {
            targetProjectPath = savedConfig.targetProjectPath;
            console.log(`Using saved path: ${targetProjectPath}`);
        }
    }

    // 如果没有目标路径，手动输入
    if (!targetProjectPath) {
        console.log('Please enter your Cocos Creator project path:');
        targetProjectPath = await askQuestion('Target project path: ');
        targetProjectPath = targetProjectPath.trim();
        
        // 处理路径中的引号和空格
        if (targetProjectPath.startsWith('"') && targetProjectPath.endsWith('"')) {
            targetProjectPath = targetProjectPath.slice(1, -1);
        }
        if (targetProjectPath.startsWith("'") && targetProjectPath.endsWith("'")) {
            targetProjectPath = targetProjectPath.slice(1, -1);
        }
    }

    // 询问是否保存配置
    if (saveConfigArg || !savedConfig || savedConfig.targetProjectPath !== targetProjectPath) {
        const shouldSave = await askQuestion('Save this path for next time? (y/N): ');
        if (shouldSave.toLowerCase() === 'y') {
            saveConfig = true;
        }
    }

    console.log('');

    // 验证目标路径
    if (!fs.existsSync(targetProjectPath)) {
        console.error(`[ERROR] Target path does not exist: ${targetProjectPath}`);
        rl.close();
        process.exit(1);
    }

    // 检查是否是 Cocos Creator 项目
    if (!isCocosProject(targetProjectPath)) {
        console.error(`[ERROR] Not a valid Cocos Creator project: ${targetProjectPath}`);
        console.error('Missing required files: project.json, assets/, or settings/');
        rl.close();
        process.exit(1);
    }

    console.log(`Target project: ${targetProjectPath}`);
    console.log('');

    // 确认操作
    if (!args.includes('--yes') && !args.includes('-y')) {
        const confirm = await askQuestion(`Copy framework to ${targetProjectPath}? (y/N): `);
        if (confirm.toLowerCase() !== 'y') {
            console.log('Cancelled.');
            rl.close();
            process.exit(0);
        }
    }

    console.log('');
    console.log('======================================');
    console.log('Installing Framework...');
    console.log('======================================');
    console.log('');

    try {
        // 复制 Script 目录到 assets
        const targetScriptDir = path.join(targetProjectPath, 'assets', 'Script');
        console.log('Copying Script directory...');
        if (fs.existsSync(targetScriptDir)) {
            console.log('  - Backing up existing Script directory...');
            const backupDir = path.join(targetProjectPath, 'assets', 'Script.backup.' + Date.now());
            fs.renameSync(targetScriptDir, backupDir);
            console.log(`  - Backup saved to: ${backupDir}`);
        }
        copyFiles(path.join(templateDir, 'Script'), targetScriptDir);
        console.log('[OK] Script directory copied');

        // 复制 scriptCodes 目录
        const targetScriptCodesDir = path.join(targetProjectPath, 'scriptCodes');
        console.log('Copying scriptCodes directory...');
        copyFiles(path.join(templateDir, 'scriptCodes'), targetScriptCodesDir);
        console.log('[OK] scriptCodes directory copied');

        // 复制 plugin 目录
        const targetPluginDir = path.join(targetProjectPath, 'plugin');
        console.log('Copying plugin directory...');
        copyFiles(path.join(templateDir, 'plugin'), targetPluginDir);
        console.log('[OK] plugin directory copied');

        // 复制 tsconfig.json
        const targetTsConfig = path.join(targetProjectPath, 'tsconfig.json');
        console.log('Copying tsconfig.json...');
        if (fs.existsSync(targetTsConfig)) {
            console.log('  - Backing up existing tsconfig.json...');
            const backupTsConfig = path.join(targetProjectPath, 'tsconfig.json.backup.' + Date.now());
            fs.copyFileSync(targetTsConfig, backupTsConfig);
            console.log(`  - Backup saved to: ${backupTsConfig}`);
        }
        copyFiles(path.join(templateDir, 'tsconfig.json'), targetTsConfig);
        console.log('[OK] tsconfig.json copied');

        // 复制 package.json
        const targetPackageJson = path.join(targetProjectPath, 'package.json');
        console.log('Updating package.json...');
        const templatePackageJson = JSON.parse(fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'));
        let targetPackageJsonContent = {};
        if (fs.existsSync(targetPackageJson)) {
            targetPackageJsonContent = JSON.parse(fs.readFileSync(targetPackageJson, 'utf-8'));
        }
        
        // 合并 scripts
        if (!targetPackageJsonContent.scripts) {
            targetPackageJsonContent.scripts = {};
        }
        Object.assign(targetPackageJsonContent.scripts, templatePackageJson.scripts);
        
        fs.writeFileSync(targetPackageJson, JSON.stringify(targetPackageJsonContent, null, 2), 'utf-8');
        console.log('[OK] package.json updated');

        // 保存配置
        if (saveConfig) {
            saveInstallConfig({
                targetProjectPath: targetProjectPath,
                lastUpdated: new Date().toISOString()
            });
        }

        console.log('');
        console.log('======================================');
        console.log('Installation Complete!');
        console.log('======================================');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Run "npm install" in the project directory');
        console.log('  2. Run "npm run generate-app-extend" to generate App extend files');
        console.log('  3. Run "npm run generate-ctrl-map" to generate Ctrl map');
        console.log('  4. Run "npm run generate-view-map" to generate View map');
        console.log('  5. Run "npm run generate-event-type" to generate event types');
        console.log('  6. Open Cocos Creator and refresh the project');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('[ERROR] Installation failed:');
        console.error(error.message);
        console.error('');
        console.error('If backup files were created, you can restore them manually.');
        rl.close();
        process.exit(1);
    }

    rl.close();
}

// 运行主函数
main().catch(err => {
    console.error('[ERROR]', err.message);
    process.exit(1);
});
