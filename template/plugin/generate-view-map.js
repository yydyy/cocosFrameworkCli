#!/usr/bin/env node

/**
 * generate-view-map.js
 * 
 * 自动扫描项目中 registerView 调用的脚本
 * 生成 IUiIdExtend 接口扩展的类型声明文件
 * 
 * 使用方式: node plugin/generate-view-map.js
 * 或配置 npm scripts: "generate-view-map": "node plugin/generate-view-map.js"
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
const OUTPUT_DTS_FILE = path.join(ASSETS_DIR, 'types/d.ts/', 'GenerateViewExtend.d.ts');
const OUTPUT_TS_FILE = path.join(ASSETS_DIR, 'types/', 'GenerateViewExtend.ts');

// ==================== 正则表达式 ====================

// 匹配 registerView 调用
const REGISTER_VIEW_REGEX = /registerView\s*\(/g;

// 匹配 IUiIdExtend 接口定义
const INTERFACE_REGEX = /export\s+interface\s+IUiIdExtend\s*\{/g;

/**
 * 检查 registerView 调用是否被注释掉
 */
function isRegisterViewCommented(content, matchIndex) {
    // 1. 单行注释检查（//）
    const lastNewLineIndex = content.lastIndexOf('\n', matchIndex);
    const nextNewLineIndex = content.indexOf('\n', matchIndex);
    const lineEnd = nextNewLineIndex === -1 ? content.length : nextNewLineIndex;
    const lineStart = lastNewLineIndex === -1 ? 0 : lastNewLineIndex + 1;
    const lineText = content.substring(lineStart, lineEnd);
    
    // 计算 matchIndex 在这一行中的位置
    const matchIndexInLine = matchIndex - lineStart;
    
    // 检查这一行是否有 // 注释，且在 // 之前是否包含 registerView
    const commentIndex = lineText.indexOf('//');
    if (commentIndex !== -1 && matchIndexInLine > commentIndex) {
        return true;
    }

    // 2. 多行注释检查（/* ... */）
    const textBeforeMatch = content.substring(0, matchIndex);
    const lastMultiLineCommentStart = textBeforeMatch.lastIndexOf('/*');
    
    if (lastMultiLineCommentStart !== -1) {
        const textAfterCommentStart = content.substring(lastMultiLineCommentStart);
        const commentEndIndex = textAfterCommentStart.indexOf('*/');
        
        if (commentEndIndex === -1 || (matchIndex - lastMultiLineCommentStart) < commentEndIndex) {
            return true;
        }
    }

    return false;
}

/**
 * 解析 TypeScript 文件，提取 registerView 调用信息
 */
async function parseTypeScriptFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf8');
        const results = [];

        // 查找 registerView 调用
        let match;
        const regex = new RegExp(REGISTER_VIEW_REGEX.source, 'g');
        
        while ((match = regex.exec(content)) !== null) {
            const startIndex = match.index + match[0].length;
            
            // 手动解析括号匹配，支持嵌套大括号和圆括号
            let openParenCount = 1; // 圆括号计数
            let openBraceCount = 0; // 花括号计数
            let viewInfoStr = '';
            let currentIndex = startIndex;
            
            while (openParenCount > 0 && currentIndex < content.length) {
                const char = content[currentIndex];
                viewInfoStr += char;
                
                if (char === '(') {
                    openParenCount++;
                } else if (char === ')') {
                    openParenCount--;
                    if (openParenCount === 0) {
                        // 找到完整的 registerView(...) 调用
                        break;
                    }
                } else if (char === '{') {
                    openBraceCount++;
                } else if (char === '}') {
                    openBraceCount--;
                }
                
                currentIndex++;
                
                // 防止无限循环
                if (currentIndex - startIndex > 1000) {
                    break;
                }
            }
            
            if (openParenCount === 0) {
                // 提取 viewInfo 对象（去掉最后的 ')'）
                const viewInfoObjStr = viewInfoStr.substring(0, viewInfoStr.length - 1).trim();
                
                // 提取 uid
                const uidMatch = viewInfoObjStr.match(/uid\s*:\s*("[^"]+"|'[^']+'|[\w.]+)/);
                if (uidMatch) {
                    let uid = uidMatch[1];
                    
                    // 处理 uid 值
                    if (uid.startsWith('"') || uid.startsWith("'")) {
                        // 字符串形式: "BattleView" 或 'BattleView'
                        uid = uid.substring(1, uid.length - 1);
                    } else if (uid.includes('.')) {
                        // 标识符形式: UiId.BattleView
                        uid = uid.split('.').pop();
                    }
                    
                    // 过滤掉无效的 uid
                    if (uid === 'UiId') {
                        continue;
                    }

                    if (uid) {
                        // 检查是否被注释
                        if (isRegisterViewCommented(content, match.index)) {
                            continue;
                        }

                        results.push({
                            uid: uid,
                            viewInfo: viewInfoObjStr,
                            filePath: filePath
                        });

                        console.log(`找到 registerView: ${uid} (${filePath})`);
                    }
                }
            }
        }

        return results;
    } catch (error) {
        console.error(`Error parsing file ${filePath}:`, error);
        return [];
    }
}

/**
 * 查找所有 TypeScript 文件
 */
async function findTypeScriptFiles(dir) {
    const files = [];
    
    async function traverse(currentDir) {
        const entries = await readdir(currentDir);
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry);
            const stats = await stat(fullPath);
            
            if (stats.isDirectory()) {
                if (entry !== 'node_modules' && entry !== 'types' && entry !== 'temp') {
                    await traverse(fullPath);
                }
            } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
                files.push(fullPath);
            }
        }
    }
    
    await traverse(dir);
    return files;
}

/**
 * 生成类型声明文件内容
 */
async function generateDTSContent(views, tsFiles) {
    const viewEntries = [];

    // 收集 view 信息
    views.forEach(view => {
        viewEntries.push(`        ${view.uid}: "${view.uid}"`);
    });

    // 智能查找 IUiIdExtend 接口定义
    const interfaceFile = await findInterfaceDefinition(tsFiles, 'IUiIdExtend');
    const modulePath = calculateDeclareModulePath(
        OUTPUT_DTS_FILE, 
        interfaceFile, 
        '../../Extend/Base/UiDefines'
    );

    // 构建文件内容
    const header = `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @Description: IUiIdExtend 接口扩展类型声明
 * 
 * 此文件由工具自动生成，请勿手动修改
 * 运行 npm run generate-view-map 自动更新
 */

import type { UiId } from "${modulePath}";

`;

    const interfaceSection = `declare module "${modulePath}" {
    interface IUiIdExtend {
${viewEntries.join('\n')}
    }
}
`;

    return header + interfaceSection;
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
 * 生成运行时注册文件内容
 */
function generateTSContent(views) {
    // 收集view信息
    const viewInfos = [];
    const viewInfoMap = [];
    
    views.forEach(view => {
        // 修复WindowType.Popup为WindowType.Dialog
        let fixedViewInfo = view.viewInfo.replace(/WindowType\.Popup/g, 'WindowType.Dialog');
        
        // 修复uid值，将UiId.xxx替换为具体的字符串
        fixedViewInfo = fixedViewInfo.replace(/uid\s*:\s*UiId\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, `uid: "$1"`);
        
        viewInfos.push(`// ${view.filePath}
const ${view.uid}ViewInfo = ${fixedViewInfo};`);
        viewInfoMap.push(`"${view.uid}": ${view.uid}ViewInfo`);
    });

    // 构建文件内容
    const header = `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @Description: 界面注册运行时文件
 * 
 * 此文件由工具自动生成，请勿手动修改
 * 运行 npm run generate-view-map 自动更新
 */

import { UiId, registerViewInfo, WindowType, UiZdxType } from "../Extend/Base/UiDefines";
import { Bundles } from "../Extend/Base/Bundles";

`;

    // 生成viewInfo定义
    const viewInfoDefinitions = viewInfos.join('\n\n');

    // 生成viewInfo映射
    const viewInfoMapObject = `
const viewInfoMap = {
    ${viewInfoMap.join(',\n    ')}
};
`;

    // 生成合并的注册循环
    const registrationLoop = `
// 注册UiId和viewInfo
for (const key in viewInfoMap) {
    const viewName = key as UiIdType;
    if (!UiId[viewName]) {
        UiId[key] = viewName;
    }
    registerViewInfo(viewName, viewInfoMap[key]);
}
`;

    return header + viewInfoDefinitions + viewInfoMapObject + registrationLoop;
}

/**
 * 主函数
 */
async function main() {
    console.log('='.repeat(50));
    console.log('开始扫描 registerView 调用...');
    console.log('='.repeat(50));

    // 查找所有 TypeScript 文件
    const tsFiles = await findTypeScriptFiles(ASSETS_DIR);
    console.log(`\n找到 ${tsFiles.length} 个 TypeScript 文件`);

    // 解析所有文件
    const allViews = [];
    for (const file of tsFiles) {
        const views = await parseTypeScriptFile(file);
        allViews.push(...views);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`找到 ${allViews.length} 个 IUiIdExtend 扩展:`);
    allViews.forEach(view => {
        console.log(`  - ${view.uid}`);
    });

    if (allViews.length === 0) {
        console.log('\n未找到任何 registerView 调用，退出...');
        console.log('\n提示: 确保文件中包含 registerView({ uid: "ViewName" }) 模式');
        return;
    }

    // 按 uid 去重（保留第一个）
    const uniqueViews = [];
    const seenUids = new Set();
    for (const view of allViews) {
        if (!seenUids.has(view.uid)) {
            seenUids.add(view.uid);
            uniqueViews.push(view);
        } else {
            console.log(`\n警告: 跳过重复的 uid "${view.uid}" (${view.filePath})`);
        }
    }

    // 生成类型定义文件内容
    const dtsContent = await generateDTSContent(uniqueViews, tsFiles);
    
    // 生成运行时注册文件内容
    const tsContent = generateTSContent(uniqueViews);

    // 确保输出目录存在
    await ensureDirectoryExists(path.dirname(OUTPUT_DTS_FILE));
    await ensureDirectoryExists(path.dirname(OUTPUT_TS_FILE));

    // 写入文件
    await writeFile(OUTPUT_DTS_FILE, dtsContent, 'utf8');
    await writeFile(OUTPUT_TS_FILE, tsContent, 'utf8');

    console.log('\n' + '='.repeat(50));
    console.log(`已生成类型声明文件：${OUTPUT_DTS_FILE}`);
    console.log(`已生成运行时注册文件：${OUTPUT_TS_FILE}`);
    console.log('='.repeat(50));
}

// 执行主函数
main().catch(console.error);
