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
            console.log(`创建目录：${dir}`);
        } else {
            throw error;
        }
    }
}

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets', 'Script');
const OUTPUT_DTS_FILE = path.join(ASSETS_DIR, 'types/d.ts/', 'GenerateCtrlIdExtend.d.ts');
const OUTPUT_TS_FILE = path.join(ASSETS_DIR, 'types/', 'GenerateCtrlIdExtend.ts');

// 匹配 @registerCtrlId(CtrlId.xxx) 装饰器调用
const REGISTER_CTRL_REGEX = /@registerCtrlId\s*\(\s*CtrlId\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;
const IMPORT_PATH_REGEX = /from\s+["']([^"']+)["']/g;

// 匹配 ICtrlIdExtend 接口定义
const INTERFACE_REGEX = /export\s+interface\s+ICtrlIdExtend\s*\{/g;

/**
 * 检查 @registerCtrlId 装饰器是否被注释掉
 */
function isDecoratorCommented(content, decoratorMatchIndex) {
    const lastNewLineIndex = content.lastIndexOf('\n', decoratorMatchIndex);
    const nextNewLineIndex = content.indexOf('\n', decoratorMatchIndex);
    const lineEnd = nextNewLineIndex === -1 ? content.length : nextNewLineIndex;
    const lineStart = lastNewLineIndex === -1 ? 0 : lastNewLineIndex + 1;
    const lineText = content.substring(lineStart, lineEnd);
    
    const matchIndexInLine = decoratorMatchIndex - lineStart;
    const commentIndex = lineText.indexOf('//');
    if (commentIndex !== -1 && matchIndexInLine > commentIndex) {
        return true;
    }

    const textBeforeMatch = content.substring(0, decoratorMatchIndex);
    const lastMultiLineCommentStart = textBeforeMatch.lastIndexOf('/*');
    
    if (lastMultiLineCommentStart !== -1) {
        const textAfterCommentStart = content.substring(lastMultiLineCommentStart);
        const multiLineCommentEnd = textAfterCommentStart.indexOf('*/');
        
        if (multiLineCommentEnd !== -1) {
            const commentEndIndex = lastMultiLineCommentStart + multiLineCommentEnd + 2;
            if (decoratorMatchIndex < commentEndIndex) {
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
 * 解析 TypeScript 文件，提取 registerClass 装饰器信息
 */
async function parseTypeScriptFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf8');
        const results = [];
        const matches = content.matchAll(REGISTER_CTRL_REGEX);

        for (const match of matches) {
            const ctrlId = match[1];
            const matchIndex = match.index;

            if (ctrlId) {
                if (isDecoratorCommented(content, matchIndex)) {
                    console.log(`跳过被注释的 @registerCtrlId: ${ctrlId} (${filePath})`);
                    continue;
                }

                const afterDecorator = content.substring(matchIndex + match[0].length);
                const classMatch = afterDecorator.match(/^\s*export\s+(?:default\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/m);
                const className = classMatch ? classMatch[1] : ctrlId;
                const isDefaultExport = classMatch ? classMatch[0].includes('export default') : false;

                let importPath = null;
                const classDefinitionRegex = new RegExp(`export\\s+(?:default\\s+)?class\\s+${className}\\b`);
                const isClassDefinedInFile = classDefinitionRegex.test(content);

                if (isClassDefinedInFile) {
                    importPath = calculateRelativeImportPath(filePath);
                    console.log(`信息：类 ${className} 在当前文件中定义，使用相对路径：${importPath}`);
                } else {
                    const importRegex = new RegExp(`import\\s+(?:\\{[^}]*\\b${className}\\b[^}]*\\}|${className})\\s+from\\s+["']([^"']+)["']`, 'g');
                    const importMatches = content.matchAll(importRegex);

                    for (const importMatch of importMatches) {
                        if (importMatch[1]) {
                            importPath = importMatch[1];
                            break;
                        }
                    }

                    if (!importPath) {
                        importPath = calculateRelativeImportPath(filePath);
                        console.log(`警告：在文件 ${filePath} 中未找到 ${className} 的导入语句，使用相对路径：${importPath}`);
                    }
                }

                results.push({
                    ctrlId: ctrlId,
                    className: className,
                    filePath: filePath,
                    importPath: importPath,
                    isDefaultExport: isDefaultExport
                });

                console.log(`在文件 ${filePath} 中找到 @registerCtrlId: ${ctrlId} -> ${className} (导入路径：${importPath}, 导出方式：${isDefaultExport ? '默认导出' : '命名导出'})`);
            }
        }

        return results;
    } catch (error) {
        console.error(`Error parsing 文件 ${filePath}:`, error);
        return [];
    }
}

/**
 * 计算相对导入路径
 */
function calculateRelativeImportPath(filePath) {
    const relativePath = path.relative(path.dirname(OUTPUT_DTS_FILE), filePath)
        .replace(/\\/g, '/')
        .replace(/\.ts$/, '');

    return relativePath.startsWith('.') ? relativePath : './' + relativePath;
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
 * 生成 ICtrlTypeMap.d.ts 文件内容
 */
async function generateTypeMapContent(mappings, tsFiles) {
    const imports = new Set();
    const typeMapEntries = [];
    const idExtendEntries = [];

    mappings.forEach(mapping => {
        if (mapping.isDefaultExport) {
            imports.add(`import type ${mapping.className} from "${mapping.importPath}"`);
        } else {
            imports.add(`import type { ${mapping.className} } from "${mapping.importPath}"`);
        }
    });

    mappings.forEach(mapping => {
        typeMapEntries.push(`        ${mapping.ctrlId}: ${mapping.className}`);
        idExtendEntries.push(`        ${mapping.ctrlId}: "${mapping.ctrlId}";`);
    });

    const interfaceFile = await findInterfaceDefinition(tsFiles, 'ICtrlIdExtend');
    const modulePath = calculateDeclareModulePath(
        OUTPUT_DTS_FILE, 
        interfaceFile, 
        '../../Extend/Base/Ectrl'
    );

    return `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @LastEditTime: ${new Date().toISOString().replace('T', ' ').split('.')[0]}
 * @FilePath: \\cocosTools\\assets\\Script\\types\\GenerateCtrlIdExtend.d.ts
 * @Description: 控制器类型映射，工具自动生成
 */


${Array.from(imports).join('\n')}

declare module "${modulePath}" {
    interface ICtrlIdExtend {
${idExtendEntries.join('\n')}
    }

    interface ICtrlTypeMap {
${typeMapEntries.join('\n')}
    }
}
`;
}

/**
 * 生成 GenerateCtrlIdExtend.ts 文件内容（运行时赋值）
 */
function generateRuntimeContent(mappings) {
    const ctrlIds = mappings.map(mapping => `"${mapping.ctrlId}"`);
    
    return `/*
 * @Author: auto-generated
 * @Date: ${new Date().toISOString().split('T')[0]}
 * @LastEditTime: ${new Date().toISOString().replace('T', ' ').split('.')[0]}
 * @FilePath: \\cocosTools\\assets\\Script\\types\\generateCtrlIdExtend.ts
 * @Description: 控制器名字映射，工具自动生成
 */


import { CtrlId } from "../Extend/Base/Ectrl";

const ctrlIds = [${ctrlIds.join(', ')}];

for (const ctrlId of ctrlIds) {
    CtrlId[ctrlId] = ctrlId;
}
`;
}

/**
 * 主函数
 */
async function main() {
    console.log('开始扫描 TypeScript 文件...');

    const tsFiles = await findTypeScriptFiles(ASSETS_DIR);
    console.log(`找到 ${tsFiles.length} 个 TypeScript 文件`);

    const allMappings = [];
    for (const file of tsFiles) {
        const mappings = await parseTypeScriptFile(file);
        allMappings.push(...mappings);
    }

    console.log(`找到 ${allMappings.length} 个 @registerClass 装饰器:`);
    allMappings.forEach(mapping => {
        console.log(`  - ${mapping.ctrlId}: ${mapping.className} (${mapping.filePath})`);
    });

    if (allMappings.length === 0) {
        console.log('未找到任何 @registerClass 装饰器，退出...');
        return;
    }

    const dtsContent = await generateTypeMapContent(allMappings, tsFiles);
    const tsContent = generateRuntimeContent(allMappings);

    await ensureDirectoryExists(path.dirname(OUTPUT_DTS_FILE));
    await ensureDirectoryExists(path.dirname(OUTPUT_TS_FILE));

    await writeFile(OUTPUT_DTS_FILE, dtsContent, 'utf8');
    console.log(`已更新 ${OUTPUT_DTS_FILE}`);

    await writeFile(OUTPUT_TS_FILE, tsContent, 'utf8');
    console.log(`已更新 ${OUTPUT_TS_FILE}`);

    console.log('='.repeat(50));
}

main().catch(error => {
    console.error('执行出错:', error);
    process.exit(1);
});
