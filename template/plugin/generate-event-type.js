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
const OUTPUT_DTS_FILE = path.join(ASSETS_DIR, 'types/d.ts/', 'GenerateEventExtend.d.ts');
const OUTPUT_EVENTS_EXTEND_FILE = path.join(ASSETS_DIR, 'types/GenerateEventsExtend.ts');

// 匹配 registerEvent<类型>("id") 或 registerEvent<类型>(xxx.ID) 泛型语法
const REGISTER_EVENT_REGEX = /registerEvent\s*<\s*(.+?)\s*>\s*\(\s*(?:"([a-zA-Z_$][a-zA-Z0-9_$]*)"|'([a-zA-Z_$][a-zA-Z0-9_$]*)'|`([a-zA-Z_$][a-zA-Z0-9_$]*)`|([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*))\s*\)/g;

// 匹配 ICustomEventsExtend 和 ICustomEvents 接口定义
const INTERFACE_REGEX = /export\s+interface\s+(ICustomEventsExtend|ICustomEvents)\s*\{/g;

/**
 * 检查 registerEvent 调用是否在注释中
 */
function isRegisterEventCommented(content, matchIndex) {
    // 1. 单行注释检查（//）
    const lastNewLineIndex = content.lastIndexOf('\n', matchIndex);
    const nextNewLineIndex = content.indexOf('\n', matchIndex);
    const lineEnd = nextNewLineIndex === -1 ? content.length : nextNewLineIndex;
    const lineStart = lastNewLineIndex === -1 ? 0 : lastNewLineIndex + 1;
    const lineText = content.substring(lineStart, lineEnd);
    
    const matchIndexInLine = matchIndex - lineStart;
    const commentIndex = lineText.indexOf('//');
    if (commentIndex !== -1 && matchIndexInLine > commentIndex) {
        return true;
    }

    // 2. 多行注释检查（/* ... */）
    const textBeforeMatch = content.substring(0, matchIndex);
    const lastMultiLineCommentStart = textBeforeMatch.lastIndexOf('/*');
    
    if (lastMultiLineCommentStart !== -1) {
        const textAfterCommentStart = content.substring(lastMultiLineCommentStart);
        const multiLineCommentEnd = textAfterCommentStart.indexOf('*/');
        
        if (multiLineCommentEnd !== -1) {
            const commentEndIndex = lastMultiLineCommentStart + multiLineCommentEnd + 2;
            if (matchIndex < commentEndIndex) {
                return true;
            }
        } else {
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
 * 解析 TypeScript 文件，提取 registerEvent 调用
 */
async function parseTypeScriptFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf8');
        const results = [];
        
        // 按行处理，更容易提取完整的函数类型
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // 匹配泛型语法：registerEvent<类型>("id") 或 registerEvent<类型>(xxx.ID)
            const match = line.match(/registerEvent\s*<\s*(.+?)\s*>\s*\(\s*(?:"([a-zA-Z_$][a-zA-Z0-9_$]*)"|'([a-zA-Z_$][a-zA-Z0-9_$]*)'|`([a-zA-Z_$][a-zA-Z0-9_$]*)`|([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*))/);
            
            if (!match) continue;
            
            // 提取事件 ID，支持字符串和 xxx.ID 格式
            // match[2], match[3], match[4] 是字符串格式
            // match[5].match[6] 是 xxx.ID 格式
            let eventId = match[2] || match[3] || match[4];
            
            // 如果是 xxx.ID 格式，使用第 6 组的 ID 部分
            if (!eventId && match[5] && match[6]) {
                eventId = match[6];
            }
            
            // 提取函数类型（从泛型参数中）
            let funcTypeStr = match[1].trim();
            
            if (!eventId || !funcTypeStr) continue;
            
            // 移除末尾的 ); 如果是行尾的话
            if (funcTypeStr.endsWith(');')) {
                funcTypeStr = funcTypeStr.slice(0, -2);
            } else if (funcTypeStr.endsWith(')')) {
                funcTypeStr = funcTypeStr.slice(0, -1);
            }
            
            // 清理类型声明：移除 undefined as any as 前缀
            funcTypeStr = funcTypeStr.replace(/^undefined\s+as\s+any\s+as\s+/i, '').trim();
            
            // 检查是否被注释
            const lineBeforeMatch = line.substring(0, match.index);
            const commentIndex = lineBeforeMatch.indexOf('//');
            if (commentIndex !== -1) {
                console.log(`跳过被注释的 registerEvent 调用：${eventId} (${filePath})`);
                continue;
            }
            
            // 清理 funcTypeStr，移除末尾可能的注释
            const commentPos = funcTypeStr.indexOf('//');
            if (commentPos !== -1) {
                funcTypeStr = funcTypeStr.substring(0, commentPos).trim();
            }
            
            // 处理多行注释的情况
            if (isRegisterEventCommented(content, match.index + lineStartOffset(lines, i))) {
                console.log(`跳过被注释的 registerEvent 调用：${eventId} (${filePath})`);
                continue;
            }
            
            results.push({
                eventId,
                funcTypeStr,
                filePath,
            });
            console.log(`在文件 ${filePath} 中找到 registerEvent 调用：${eventId}, 类型：${funcTypeStr}`);
        }

        return results;
    } catch (error) {
        console.error(`Error parsing 文件 ${filePath}:`, error);
        return [];
    }
}

/**
 * 计算某一行在完整内容中的偏移量
 */
function lineStartOffset(lines, lineIndex) {
    let offset = 0;
    for (let i = 0; i < lineIndex; i++) {
        offset += lines[i].length + 1; // +1 for newline
    }
    return offset;
}

/**
 * 生成事件扩展 d.ts 文件内容
 */
async function generateEventDtsContent(mappings, tsFiles) {
    const uniqueEvents = Array.from(new Set(mappings.map(m => m.eventId))).sort();
    
    // 生成 ICustomEventsExtend 的条目（事件 ID 字符串映射）
    const eventExtendEntries = uniqueEvents.map(id => {
        return `        "${id}": "${id}";`;
    }).join('\n');
    
    // 生成 ICustomEvents 的条目（回调函数类型）
    const customEventsEntries = uniqueEvents.map(id => {
        const mapping = mappings.find(m => m.eventId === id);
        return `        [GameEvents.${id}]: ${mapping?.funcTypeStr || '() => void'};`;
    }).join('\n');

    // 智能查找 ICustomEventsExtend 和 ICustomEvents 接口定义
    const interfaceFile = await findInterfaceDefinition(tsFiles, 'ICustomEventsExtend') || 
                          await findInterfaceDefinition(tsFiles, 'ICustomEvents');
    const modulePath = calculateDeclareModulePath(
        OUTPUT_DTS_FILE, 
        interfaceFile, 
        '../../Extend/Base/Events'
    );

    return `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @LastEditTime: ${new Date().toISOString().replace('T', ' ').split('.')[0]}
 * @FilePath: \\\\cocosTools\\\\assets\\\\Script\\\\types\\\\d.ts\\\\GenerateEventExtend.d.ts
 * @Description: 事件回调类型扩展，工具自动生成
 */

import type { GameEvents } from "${modulePath}";

declare module "${modulePath}" {
    interface ICustomEventsExtend {
${eventExtendEntries}
    }
}

declare module "${modulePath}" {
    interface ICustomEvents {
${customEventsEntries}
    }
}
`;
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
 * 生成 Events 扩展类型文件（类似 GenerateCtrlIdExtend.ts）
 */
function generateEventsExtendContent(mappings) {
    const uniqueEvents = Array.from(new Set(mappings.map(m => m.eventId))).sort();
    const eventIds = uniqueEvents.map(id => `"${id}"`);

    return `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @LastEditTime: ${new Date().toISOString().replace('T', ' ').split('.')[0]}
 * @FilePath: \\cocosTools\\assets\\Script\\types\\GenerateEventsExtend.ts
 * @Description: 事件名字映射，工具自动生成
 */


import { GameEvents } from "../Extend/Base/Events";

const eventIds = [${eventIds.join(', ')}];

// 注册GameEvents
for (const eventId of eventIds) {
    GameEvents[eventId] = eventId;
}
`;
}

/**
 * 主函数
 */
async function main() {
    console.log('开始扫描 TypeScript 文件中的 registerEvent 调用...');

    // 查找所有 TypeScript 文件
    const tsFiles = await findTypeScriptFiles(ASSETS_DIR);
    console.log(`找到 ${tsFiles.length} 个 TypeScript 文件`);

    // 解析所有文件
    const allMappings = [];
    for (const file of tsFiles) {
        const mappings = await parseTypeScriptFile(file);
        allMappings.push(...mappings);
    }

    console.log(`找到 ${allMappings.length} 个有效的 registerEvent 调用`);

    // 生成类型定义文件内容
    const dtsContent = await generateEventDtsContent(allMappings, tsFiles);

    // 确保输出目录存在
    await ensureDirectoryExists(path.dirname(OUTPUT_DTS_FILE));
    await ensureDirectoryExists(path.dirname(OUTPUT_EVENTS_EXTEND_FILE));

    // 写入类型定义文件
    await writeFile(OUTPUT_DTS_FILE, dtsContent, 'utf8');
    console.log(`已更新 ${OUTPUT_DTS_FILE}`);

    // 生成 Events 扩展类型文件
    const eventsExtendContent = generateEventsExtendContent(allMappings);
    await writeFile(OUTPUT_EVENTS_EXTEND_FILE, eventsExtendContent, 'utf8');
    console.log(`已更新 ${OUTPUT_EVENTS_EXTEND_FILE}`);

    console.log('='.repeat(50));
}

// 执行主函数
main().catch(error => {
    console.error('执行出错:', error);
    process.exit(1);
});
