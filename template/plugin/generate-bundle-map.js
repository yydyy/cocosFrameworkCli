#!/usr/bin/env node

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

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets', 'Script');
const OUTPUT_DTS_FILE = path.join(ASSETS_DIR, 'types/d.ts/', 'GenerateBundleExtend.d.ts');

// 匹配 registerBundle("xxx") 或 registerBundle('xxx') 或 registerBundle(xxx.ID)
const REGISTER_BUNDLE_REGEX = /registerBundle\s*\(\s*(?:"([a-zA-Z_$][a-zA-Z0-9_$]*)"|'([a-zA-Z_$][a-zA-Z0-9_$]*)'|`([a-zA-Z_$][a-zA-Z0-9_$]*)`|([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*))\s*\)/g;

// 匹配 IBundleIdExtend 接口定义
const INTERFACE_REGEX = /export\s+interface\s+IBundleIdExtend\s*\{/g;

/**
 * 检查 registerBundle 调用是否在注释中
 * 通过移除所有注释内容后再检查原位置是否还存在来判断
 */
function isRegisterBundleCommented(content, matchIndex) {
    // 1. 单行注释检查（//）
    // 找到 matchIndex 所在的行
    const lastNewLineIndex = content.lastIndexOf('\n', matchIndex);
    const nextNewLineIndex = content.indexOf('\n', matchIndex);
    const lineEnd = nextNewLineIndex === -1 ? content.length : nextNewLineIndex;
    const lineStart = lastNewLineIndex === -1 ? 0 : lastNewLineIndex + 1;
    const lineText = content.substring(lineStart, lineEnd);
    
    // 计算 matchIndex 在这一行中的位置
    const matchIndexInLine = matchIndex - lineStart;
    
    // 检查这一行是否有 // 注释，且在 // 之前是否包含 registerBundle
    const commentIndex = lineText.indexOf('//');
    if (commentIndex !== -1 && matchIndexInLine > commentIndex) {
        // registerBundle 在 // 之后，说明被注释了
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
                    // 跳过 node_modules 和其他不需要的目录
                    if (item === 'node_modules' || item === '.git' || item === 'build') {
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
 * 解析 TypeScript 文件，提取 registerBundle 调用
 */
async function parseTypeScriptFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf8');

        const results = [];
        const matches = content.matchAll(REGISTER_BUNDLE_REGEX);

        for (const match of matches) {
            // 提取 bundle ID，支持字符串和 xxx.ID 格式
            // match[1], match[2], match[3] 是字符串格式
            // match[4].match[5] 是 xxx.ID 格式
            let bundleId = match[1] || match[2] || match[3];
            
            // 如果是 xxx.ID 格式，使用第 5 组的 ID 部分
            if (!bundleId && match[4] && match[5]) {
                bundleId = match[5];
            }
            
            const matchIndex = match.index;

            if (!bundleId || matchIndex == null) continue;

            // 跳过被注释掉的调用
            if (isRegisterBundleCommented(content, matchIndex)) {
                console.log(`跳过被注释的 registerBundle 调用：${bundleId} (${filePath})`);
                continue;
            }

            results.push({
                bundleId,
                filePath,
            });
            console.log(`在文件 ${filePath} 中找到 registerBundle 调用：${bundleId}`);
        }

        return results;
    } catch (error) {
        console.error(`Error parsing 文件 ${filePath}:`, error);
        return [];
    }
}

/**
 * 查找接口定义的文件路径
 */
async function findInterfaceDefinition(tsFiles, interfaceName) {
    console.log(`\n正在查找 ${interfaceName} 接口定义...`);
    
    for (const file of tsFiles) {
        try {
            const content = await readFile(file, 'utf8');
            const matches = content.matchAll(INTERFACE_REGEX);
            
            for (const match of matches) {
                if (match[1] === interfaceName) {
                    console.log(`找到 ${interfaceName} 定义：${file}`);
                    return file;
                }
            }
        } catch (error) {
            console.error(`Error reading file ${file}:`, error);
        }
    }
    
    console.log(`未找到 ${interfaceName} 定义，使用默认路径`);
    return null;
}

/**
 * 计算 declare module 的路径
 */
function calculateDeclareModulePath(outputFile, interfaceFile, defaultPath) {
    if (!interfaceFile) {
        return defaultPath;
    }
    
    const relativePath = path.relative(path.dirname(outputFile), interfaceFile)
        .replace(/\\/g, '/')
        .replace(/\.ts$/, '');
    
    const normalizedPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    return normalizedPath.replace(/^\.\//, '');
}

/**
 * 生成 Bundle 扩展 d.ts 文件内容
 */
async function generateBundleDtsContent(mappings, tsFiles) {
    const uniqueIds = Array.from(new Set(mappings.map(m => m.bundleId))).sort();
    const idExtendEntries = uniqueIds.map(id => `        ${id}: "${id}";`).join('\n');

    // 智能查找 IBundleIdExtend 接口定义
    const interfaceFile = await findInterfaceDefinition(tsFiles, 'IBundleIdExtend');
    const modulePath = calculateDeclareModulePath(
        OUTPUT_DTS_FILE, 
        interfaceFile, 
        '../../Extend/Base/Bundles'
    );

    return `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @LastEditTime: ${new Date().toISOString().replace('T', ' ').split('.')[0]}
 * @FilePath: \\\\cocosTools\\\\assets\\\\Script\\\\types\\\\GenerateBundleExtend.d.ts
 * @Description: Bundle 名字类型扩展，工具自动生成
 */

import type { Bundles } from "${modulePath}";

declare module "${modulePath}" {
    interface IBundleIdExtend {
${idExtendEntries}
    }
}
`;
}

/**
 * 主函数
 */
async function main() {
    console.log('开始扫描 TypeScript 文件中的 registerBundle 调用...');

    // 查找所有 TypeScript 文件
    const tsFiles = await findTypeScriptFiles(ASSETS_DIR);
    console.log(`找到 ${tsFiles.length} 个 TypeScript 文件`);

    // 解析所有文件
    const allMappings = [];
    for (const file of tsFiles) {
        const mappings = await parseTypeScriptFile(file);
        allMappings.push(...mappings);
    }

    console.log(`找到 ${allMappings.length} 个 registerBundle 调用`);

    // 生成类型定义文件内容（即使没有调用也会写入一个空扩展，保证旧内容被清空）
    const dtsContent = await generateBundleDtsContent(allMappings, tsFiles);

    // 确保输出目录存在
    await ensureDirectoryExists(path.dirname(OUTPUT_DTS_FILE));

    // 写入类型定义文件
    await writeFile(OUTPUT_DTS_FILE, dtsContent, 'utf8');
    console.log(`已更新 ${OUTPUT_DTS_FILE}`);

    console.log('='.repeat(50));
}

// 执行主函数
main().catch(error => {
    console.error('执行出错:', error);
    process.exit(1);
});

