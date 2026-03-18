#!/usr/bin/env node

/**
 * 跨平台框架模板设置脚本
 * 自动检测操作系统并执行对应的设置脚本
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const scriptDir = __dirname;
const platform = os.platform();

console.log('======================================');
console.log('Cocos Framework Template Setup');
console.log('======================================');
console.log('');
console.log(`Detecting platform: ${platform}`);
console.log('');

// 检查配置文件
const configPath = path.join(scriptDir, 'setup-config.json');
if (!fs.existsSync(configPath)) {
    console.error('[ERROR] setup-config.json not found');
    console.error('Please create setup-config.json and configure cocosToolsPath first');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 验证配置
if (!config.cocosToolsPath) {
    console.error('[ERROR] cocosToolsPath is not configured in setup-config.json');
    process.exit(1);
}

// 获取当前平台的路径
let cocosToolsPath;
if (typeof config.cocosToolsPath === 'object') {
    // 优先使用当前平台的配置，然后按平台类型回退
    cocosToolsPath = config.cocosToolsPath[platform] || 
                     (platform === 'win32' ? config.cocosToolsPath.windows : 
                      platform === 'darwin' ? config.cocosToolsPath.darwin : 
                      platform === 'linux' ? config.cocosToolsPath.linux : 
                      config.cocosToolsPath.windows || config.cocosToolsPath.darwin || config.cocosToolsPath.linux);
} else {
    cocosToolsPath = config.cocosToolsPath;
}

if (!cocosToolsPath) {
    console.error(`[ERROR] No cocosToolsPath configured for platform: ${platform}`);
    process.exit(1);
}

console.log(`Using cocosTools path: ${cocosToolsPath}`);
console.log('');

// 检查 cocosTools 路径是否存在
if (!fs.existsSync(cocosToolsPath)) {
    console.error(`[ERROR] cocosTools path does not exist: ${cocosToolsPath}`);
    process.exit(1);
}

// 根据平台执行对应的脚本
let script;
let shell = 'sh';

if (platform === 'win32') {
    script = path.join(scriptDir, 'setup-template.ps1');
    shell = 'powershell';
    
    if (!fs.existsSync(script)) {
        console.error(`[ERROR] PowerShell script not found: ${script}`);
        process.exit(1);
    }
    
    console.log('Executing PowerShell script...');
    console.log('');
    
    execSync(`powershell -ExecutionPolicy Bypass -File "${script}"`, {
        stdio: 'inherit',
        cwd: scriptDir
    });
} else {
    script = path.join(scriptDir, 'setup-template.sh');
    
    if (!fs.existsSync(script)) {
        console.error(`[ERROR] Shell script not found: ${script}`);
        process.exit(1);
    }
    
    console.log('Executing Shell script...');
    console.log('');
    
    // 确保脚本有执行权限
    try {
        execSync(`chmod +x "${script}"`);
    } catch (e) {
        // 忽略 chmod 错误
    }
    
    execSync(`"${script}"`, {
        stdio: 'inherit',
        cwd: scriptDir,
        shell: '/bin/bash'
    });
}

console.log('');
console.log('======================================');
console.log('Setup Complete!');
console.log('======================================');
