#!/usr/bin/env node

/**
 * 检查装饰器模块导入是否正确
 * 确保所有装饰器都从 Decorate.ts 统一导入，而不是直接从子模块导入
 * 同时禁止导入 core-scripts 相关模块（这是插件，只在 .d.ts 中声明）
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets', 'Script');

// 错误的导入模式
const BAD_IMPORT_PATTERNS = [
    /from\s+["'].*\/decorator\/Singleton["']/g,
    /from\s+["'].*\/decorator\/Identifiable["']/g,
    /from\s+["'].*\/decorator\/Registrars["']/g,
    // 禁止导入 core-scripts 相关模块
    /from\s+["']core-scripts["']/g,
    /from\s+["']core-scripts\/.*["']/g
];

// 正确的导入模式
const GOOD_IMPORT_PATTERN = /from\s+["'].*\/decorator\/Decorate["']/g;

function findTypeScriptFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // 跳过 decorator 目录，内部模块可以互相导入
            if (file !== 'decorator') {
                findTypeScriptFiles(filePath, fileList);
            }
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    const errors = [];
    
    BAD_IMPORT_PATTERNS.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach(match => {
                let suggestion;
                if (index < 3) {
                    // 装饰器导入错误
                    suggestion = '请从 "../decorator/Decorate" 导入';
                } else {
                    // core-scripts 导入错误
                    suggestion = 'core-scripts 是插件模块，不能直接导入。请使用全局对象 $gb 或通过 window 访问';
                }
                
                errors.push({
                    file: relativePath,
                    import: match,
                    suggestion: suggestion
                });
            });
        }
    });
    
    return errors;
}

function main() {
    console.log('='.repeat(60));
    console.log('检查装饰器模块导入...');
    console.log('='.repeat(60));
    
    const tsFiles = findTypeScriptFiles(ASSETS_DIR);
    console.log(`找到 ${tsFiles.length} 个 TypeScript 文件\n`);
    
    let allErrors = [];
    
    tsFiles.forEach(file => {
        const errors = checkFile(file);
        allErrors.push(...errors);
    });
    
    if (allErrors.length === 0) {
        console.log('✅ 所有导入检查通过！');
        console.log('='.repeat(60));
        process.exit(0);
    } else {
        console.log(`❌ 发现 ${allErrors.length} 个导入问题：\n`);
        
        allErrors.forEach((error, index) => {
            console.log(`${index + 1}. 文件: ${error.file}`);
            console.log(`   错误导入: ${error.import}`);
            console.log(`   建议: ${error.suggestion}\n`);
        });
        
        console.log('='.repeat(60));
        console.log('请修复上述导入问题后再提交！');
        console.log('='.repeat(60));
        process.exit(1);
    }
}

main();
