#!/usr/bin/env node

/**
 * generate-app-extend.js
 * 
 * 自动扫描项目中 registerApp 调用的脚本
 * 生成 IAppExtend 接口扩展的类型声明文件
 * 
 * 使用方式: node plugin/generate-app-extend.js
 * 或配置 npm scripts: "generate-app-extend": "node plugin/generate-app-extend.js"
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

/**
 * 确保目录存在，如果不存在则创建
 */
async function ensureDirectoryExists(dir) {
    try {
        await stat(dir);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await mkdir(dir, { recursive: true });
            console.log(`创建目录: ${dir}`);
        } else {
            throw error;
        }
    }
}

// ==================== 路径配置 ====================
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets', 'Script');
const OUTPUT_DTS_FILE = path.join(ASSETS_DIR, 'types/d.ts/', 'GenerateAppExtend.d.ts');

// ==================== 正则表达式 ====================

// 匹配 registerApp("key", Singleton) 调用
const REGISTER_APP_REGEX = /registerApp\s*\(\s*["']([a-zA-Z_$][a-zA-Z0-9_$]*)["']\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;

// 匹配 IAppExtend 接口定义
const IAPP_EXTEND_REGEX = /export\s+interface\s+IAppExtend\s*\{/g;

// 匹配 module 声明（用于查找现有的 declare module 路径）
const DECLARE_MODULE_REGEX = /declare\s+module\s+["']([^"']+)["']/g;

/**
 * 检查 registerApp 调用是否被注释掉
 */
function isRegisterAppCommented(content, matchIndex) {
    // 1. 单行注释检查（//）
    // 找到 matchIndex 所在的行
    const lastNewLineIndex = content.lastIndexOf('\n', matchIndex);
    const nextNewLineIndex = content.indexOf('\n', matchIndex);
    const lineEnd = nextNewLineIndex === -1 ? content.length : nextNewLineIndex;
    const lineStart = lastNewLineIndex === -1 ? 0 : lastNewLineIndex + 1;
    const lineText = content.substring(lineStart, lineEnd);
    
    // 计算 matchIndex 在这一行中的位置
    const matchIndexInLine = matchIndex - lineStart;
    
    // 检查这一行是否有 // 注释，且在 // 之前是否包含 registerApp
    const commentIndex = lineText.indexOf('//');
    if (commentIndex !== -1 && matchIndexInLine > commentIndex) {
        // registerApp 在 // 之后，说明被注释了
        return true;
    }

    // 2. 多行注释检查（/* ... */）
    // 找到 matchIndex 之前最近的 /* 和之后最近的 */
    const textBeforeMatch = content.substring(0, matchIndex);
    const lastMultiLineCommentStart = textBeforeMatch.lastIndexOf('/*');
    
    if (lastMultiLineCommentStart !== -1) {
        const textAfterCommentStart = content.substring(lastMultiLineCommentStart);
        const multiLineCommentEnd = textAfterCommentStart.indexOf('*/');
        
        // 如果找到了 */ 且 matchIndex 在 /* 和 */ 之间
        if (multiLineCommentEnd !== -1) {
            const commentEndIndex = lastMultiLineCommentStart + multiLineCommentEnd + 2;
            if (matchIndex < commentEndIndex) {
                return true;
            }
        } else {
            // 没有找到 */，说明 /* 一直延续到文件末尾或者 matchIndex 在其后
            // 这种情况下 matchIndex 在注释中
            return true;
        }
    }

    return false;
}

/**
 * 递归查找所有 TypeScript 文件
 */
async function findTypeScriptFiles(dir) {
    const files = [];

    async function scanDirectory(currentDir) {
        try {
            const items = await readdir(currentDir);

            for (const item of items) {
                const itemPath = path.join(currentDir, item);
                const itemStat = await stat(itemPath);

                if (itemStat.isDirectory()) {
                    // 跳过不需要的目录
                    if (item === 'node_modules' || item === '.git' || item === 'build' || item === '.vscode') {
                        continue;
                    }
                    await scanDirectory(itemPath);
                } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
                    files.push(itemPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${currentDir}:`, error);
        }
    }

    await scanDirectory(dir);
    return files;
}

/**
 * 解析 TypeScript 文件，提取 registerApp 调用信息
 */
async function parseTypeScriptFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf8');
        const results = [];

        // 查找 registerApp 调用
        const registerAppMatches = content.matchAll(REGISTER_APP_REGEX);
        
        for (const match of registerAppMatches) {
            const key = match[1];          // "load" -> load
            const singletonName = match[2];  // LoadMgr
            
            if (key && singletonName) {
                // 检查是否被注释
                if (isRegisterAppCommented(content, match.index)) {
                    console.log(`跳过被注释的 registerApp: ${key}, ${singletonName} (${filePath})`);
                    continue;
                }

                results.push({
                    key: key,
                    singletonName: singletonName,
                    filePath: filePath
                });

                console.log(`找到 registerApp: ${key} -> ${singletonName} (${filePath})`);
            }
        }

        return results;
    } catch (error) {
        console.error(`Error parsing file ${filePath}:`, error);
        return [];
    }
}

/**
 * 查找 IAppExtend 接口定义的文件路径
 */
async function findIAppExtendDefinition(tsFiles) {
    console.log('\n正在查找 IAppExtend 接口定义...');
    
    for (const file of tsFiles) {
        try {
            const content = await readFile(file, 'utf8');
            const matches = content.matchAll(IAPP_EXTEND_REGEX);
            
            for (const match of matches) {
                console.log(`找到 IAppExtend 定义：${file}`);
                return file;
            }
        } catch (error) {
            console.error(`Error reading file ${file}:`, error);
        }
    }
    
    console.log('未找到 IAppExtend 定义，使用默认路径');
    return null;
}

/**
 * 计算从输出文件到目标文件的相对导入路径
 */
function calculateRelativeImportPath(filePath) {
    const relativePath = path.relative(path.dirname(OUTPUT_DTS_FILE), filePath)
        .replace(/\\/g, '/')
        .replace(/\.ts$/, '');

    // 如果路径不以 ./ 或 ../ 开头，添加 ./
    return relativePath.startsWith('.') ? relativePath : './' + relativePath;
}

/**
 * 计算 declare module 的路径
 * 从输出文件位置推导到 IAppExtend 定义文件的相对路径
 */
function calculateDeclareModulePath(iAppExtendFile) {
    if (!iAppExtendFile) {
        // 默认返回 AppExtend 的路径
        return '../../Extend/mgr/AppExtend';
    }
    
    const relativePath = path.relative(path.dirname(OUTPUT_DTS_FILE), iAppExtendFile)
        .replace(/\\/g, '/')
        .replace(/\.ts$/, '');
    
    // 如果路径不以 ./ 或 ../ 开头，添加 ./
    const normalizedPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    
    // 移除开头的 ./
    return normalizedPath.replace(/^\.\//, '');
}

/**
 * 生成类型声明文件内容
 */
function generateDTSContent(mappings, iAppExtendFile) {
    const imports = new Set();
    const appExtendEntries = [];

    // 收集导入和类型映射
    mappings.forEach(mapping => {
        const importPath = calculateRelativeImportPath(mapping.filePath);
        
        // 使用命名导入
        imports.add(`import type { ${mapping.singletonName} } from "${importPath}"`);
        
        // 生成接口属性，使用 InstanceType<typeof XXX> 格式
        appExtendEntries.push(`        ${mapping.key}: InstanceType<typeof ${mapping.singletonName}>`);
    });

    // 计算 declare module 路径
    const modulePath = calculateDeclareModulePath(iAppExtendFile);

    // 构建文件内容
    const header = `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @Description: IAppExtend 接口扩展类型声明
 * 
 * 此文件由工具自动生成，请勿手动修改
 * 运行 npm run generate-app-extend 自动更新
 */

`;

    const importSection = Array.from(imports).join('\n') + '\n\n';

    const interfaceSection = `declare module "${modulePath}" {
    interface IAppExtend {
${appExtendEntries.join('\n')}
    }
}
`;

    return header + importSection + interfaceSection;
}

/**
 * 主函数
 */
async function main() {
    console.log('='.repeat(50));
    console.log('开始扫描 registerApp 调用...');
    console.log('='.repeat(50));

    // 查找所有 TypeScript 文件
    const tsFiles = await findTypeScriptFiles(ASSETS_DIR);
    console.log(`\n找到 ${tsFiles.length} 个 TypeScript 文件`);

    // 查找 IAppExtend 接口定义
    const iAppExtendFile = await findIAppExtendDefinition(tsFiles);

    // 解析所有文件
    const allMappings = [];
    for (const file of tsFiles) {
        const mappings = await parseTypeScriptFile(file);
        allMappings.push(...mappings);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`找到 ${allMappings.length} 个 IAppExtend 扩展:`);
    allMappings.forEach(mapping => {
        console.log(`  - ${mapping.key}: ${mapping.singletonName}`);
    });

    if (allMappings.length === 0) {
        console.log('\n未找到任何 registerApp 调用，退出...');
        console.log('\n提示: 确保文件中包含 registerApp("key", Singleton) 模式');
        return;
    }

    // 按 key 去重（保留第一个）
    const uniqueMappings = [];
    const seenKeys = new Set();
    for (const mapping of allMappings) {
        if (!seenKeys.has(mapping.key)) {
            seenKeys.add(mapping.key);
            uniqueMappings.push(mapping);
        } else {
            console.log(`\n警告: 跳过重复的 key "${mapping.key}" (${mapping.filePath})`);
        }
    }

    // 生成类型定义文件内容
    const dtsContent = generateDTSContent(uniqueMappings, iAppExtendFile);

    // 确保输出目录存在
    await ensureDirectoryExists(path.dirname(OUTPUT_DTS_FILE));

    // 写入文件
    await writeFile(OUTPUT_DTS_FILE, dtsContent, 'utf8');

    console.log('\n' + '='.repeat(50));
    console.log(`已生成类型声明文件：${OUTPUT_DTS_FILE}`);
    console.log(`declare module 路径：${calculateDeclareModulePath(iAppExtendFile)}`);
    console.log('='.repeat(50));
}

// 执行主函数
main().catch(console.error);