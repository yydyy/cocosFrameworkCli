#!/usr/bin/env node

/**
 * 安装后自动执行的脚本
 * 将框架模板拷贝到目标项目
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// 目标项目根目录（执行 npm install 的目录）
const TARGET_PROJECT_ROOT = process.env.INIT_CWD || process.cwd();

// 需要拷贝的目录和文件
const TEMPLATE_FILES = [
    {
        src: 'template/scriptCodes',
        dest: 'scriptCodes',
        desc: '核心插件代码'
    },
    {
        src: 'template/Script/Extend',
        dest: 'assets/Script/Extend',
        desc: '扩展模块'
    },
    {
        src: 'template/Script/App.ts',
        dest: 'assets/Script/App.ts',
        desc: 'App 入口'
    },
    {
        src: 'template/Script/bootstrap.ts',
        dest: 'assets/Script/bootstrap.ts',
        desc: '启动引导'
    },
    {
        src: 'template/Script/global.d.ts',
        dest: 'assets/Script/global.d.ts',
        desc: '全局类型声明'
    },
    {
        src: 'template/Script/types',
        dest: 'assets/Script/types',
        desc: '类型定义'
    }
];

// 需要合并的配置文件
const CONFIG_FILES = [
    {
        src: 'template/tsconfig.json',
        dest: 'tsconfig.json',
        desc: 'TypeScript 配置',
        merge: true
    },
    {
        src: 'template/package.json',
        dest: 'package.json',
        desc: '项目配置',
        merge: true
    }
];

async function copyFile(item) {
    const srcPath = path.join(__dirname, '..', item.src);
    const destPath = path.join(TARGET_PROJECT_ROOT, item.dest);
    
    console.log(`正在拷贝 ${item.desc}...`);
    
    try {
        await fs.copy(srcPath, destPath, {
            overwrite: false,
            errorOnExist: true
        });
        console.log(chalk.green(`✅ ${item.dest}`));
    } catch (error) {
        if (error.code === 'EEXIST') {
            console.log(chalk.yellow(`⚠️  ${item.dest} 已存在，跳过`));
        } else {
            console.log(chalk.red(`❌ 拷贝失败：${error.message}`));
        }
    }
}

async function mergeConfigFile(item) {
    const srcPath = path.join(__dirname, '..', item.src);
    const destPath = path.join(TARGET_PROJECT_ROOT, item.dest);
    
    console.log(`正在处理 ${item.desc}...`);
    
    try {
        const srcConfig = await fs.readJson(srcPath);
        let destConfig = {};
        
        if (await fs.pathExists(destPath)) {
            destConfig = await fs.readJson(destPath);
        }
        
        // 合并配置
        const mergedConfig = { ...destConfig, ...srcConfig };
        
        // 特殊处理某些需要深度合并的字段
        if (item.dest === 'tsconfig.json') {
            if (destConfig.compilerOptions && srcConfig.compilerOptions) {
                mergedConfig.compilerOptions = {
                    ...destConfig.compilerOptions,
                    ...srcConfig.compilerOptions
                };
            }
            if (destConfig.include && srcConfig.include) {
                mergedConfig.include = [...new Set([...destConfig.include, ...srcConfig.include])];
            }
        }
        
        await fs.writeJson(destPath, mergedConfig, { spaces: 4 });
        console.log(chalk.green(`✅ 已更新 ${item.dest}`));
    } catch (error) {
        console.log(chalk.red(`❌ 处理 ${item.dest} 失败：${error.message}`));
    }
}

async function createGitignore() {
    const gitignorePath = path.join(TARGET_PROJECT_ROOT, '.gitignore');
    const gitignoreContent = `
# Cocos Framework
scriptCodes/dist/
scriptCodes/node_modules/
temp/
local/
library/

# Dependencies
node_modules/

# Build output
build/
`;
    
    try {
        if (await fs.pathExists(gitignorePath)) {
            const content = await fs.readFile(gitignorePath, 'utf8');
            if (!content.includes('# Cocos Framework')) {
                await fs.appendFile(gitignorePath, '\n' + gitignoreContent);
                console.log(chalk.green('✅ 已更新 .gitignore'));
            }
        } else {
            await fs.writeFile(gitignorePath, gitignoreContent);
            console.log(chalk.green('✅ 已创建 .gitignore'));
        }
    } catch (error) {
        console.log(chalk.yellow(`⚠️  处理 .gitignore 失败：${error.message}`));
    }
}

async function showSuccessMessage() {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.green.bold('🎉 框架安装成功！'));
    console.log('='.repeat(60));
    console.log('\n下一步操作：');
    console.log('  1. 检查 assets/Script 目录下的文件');
    console.log('  2. 根据需要修改 App.ts 和配置文件');
    console.log('  3. 运行 Cocos Creator 打开项目');
    console.log('\n使用 CLI 工具：');
    console.log('  npx cocos-framework --help');
    console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.cyan.bold('Cocos Framework 安装向导'));
    console.log('='.repeat(60));
    console.log(`目标目录：${TARGET_PROJECT_ROOT}\n`);
    
    // 拷贝框架文件
    for (const item of TEMPLATE_FILES) {
        await copyFile(item);
    }
    
    // 合并配置文件
    for (const item of CONFIG_FILES) {
        await mergeConfigFile(item);
    }
    
    // 创建/更新 .gitignore
    await createGitignore();
    
    // 显示成功消息
    await showSuccessMessage();
}

// 执行安装
main().catch(error => {
    console.error(chalk.red('安装失败:'), error);
    process.exit(1);
});
