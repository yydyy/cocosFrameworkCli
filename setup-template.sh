#!/bin/bash

# 框架模板设置脚本
# 用于将 cocosTools 的框架文件复制到 cocosFrameworkCli/template 目录

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/setup-config.json"
TEMPLATE_DIR="$SCRIPT_DIR/template"

# 读取配置文件获取 cocosTools 路径
if [ -f "$CONFIG_PATH" ]; then
    # 使用 node 或 python 解析 JSON（跨平台兼容）
    if command -v node &> /dev/null; then
        COCOS_TOOLS=$(node -e "const config = require('$CONFIG_PATH'); if (typeof config.cocosToolsPath === 'object') { console.log(config.cocosToolsPath[process.platform] || config.cocosToolsPath.darwin || config.cocosToolsPath.linux || ''); } else { console.log(config.cocosToolsPath); }")
    elif command -v python3 &> /dev/null; then
        COCOS_TOOLS=$(python3 -c "import json, sys, os; config = json.load(open('$CONFIG_PATH')); cp = config['cocosToolsPath']; print(cp.get(os.uname().sysname.lower(), cp.get('darwin', cp.get('linux', ''))) if isinstance(cp, dict) else cp)")
    else
        echo "[ERROR] Need node.js or python3 to parse JSON config"
        exit 1
    fi
    
    if [ -z "$COCOS_TOOLS" ]; then
        echo "[ERROR] cocosToolsPath is empty in setup-config.json"
        exit 1
    fi
else
    echo "[ERROR] setup-config.json not found"
    exit 1
fi

echo "======================================"
echo "Cocos Framework 模板设置"
echo "======================================"
echo ""

# 创建 template 目录
echo "创建 template 目录..."
mkdir -p "$TEMPLATE_DIR"

# 复制 scriptCodes
echo "复制 scriptCodes..."
if [ -d "$COCOS_TOOLS/scriptCodes" ]; then
    cp -r "$COCOS_TOOLS/scriptCodes" "$TEMPLATE_DIR/"
    echo "✅ scriptCodes 已复制"
else
    echo "⚠️  未找到 scriptCodes 目录"
fi

# 复制 Script 目录
echo "复制 Script 目录..."
mkdir -p "$TEMPLATE_DIR/Script"

if [ -d "$COCOS_TOOLS/assets/Script/Extend" ]; then
    cp -r "$COCOS_TOOLS/assets/Script/Extend" "$TEMPLATE_DIR/Script/"
    echo "✅ Extend 已复制"
fi

if [ -f "$COCOS_TOOLS/assets/Script/App.ts" ]; then
    cp "$COCOS_TOOLS/assets/Script/App.ts" "$TEMPLATE_DIR/Script/"
    echo "✅ App.ts 已复制"
fi

if [ -f "$COCOS_TOOLS/assets/Script/bootstrap.ts" ]; then
    cp "$COCOS_TOOLS/assets/Script/bootstrap.ts" "$TEMPLATE_DIR/Script/"
    echo "✅ bootstrap.ts 已复制"
fi

if [ -f "$COCOS_TOOLS/assets/Script/global.d.ts" ]; then
    cp "$COCOS_TOOLS/assets/Script/global.d.ts" "$TEMPLATE_DIR/Script/"
    echo "✅ global.d.ts 已复制"
fi

if [ -d "$COCOS_TOOLS/assets/Script/types" ]; then
    cp -r "$COCOS_TOOLS/assets/Script/types" "$TEMPLATE_DIR/Script/"
    echo "✅ types 已复制"
fi

# 复制 plugin 目录
echo "复制 plugin 目录..."
if [ -d "$COCOS_TOOLS/plugin" ]; then
    cp -r "$COCOS_TOOLS/plugin" "$TEMPLATE_DIR/"
    echo "✅ plugin 已复制"
fi

# 创建 tsconfig.json 模板
echo "创建 tsconfig.json 模板..."
cat > "$TEMPLATE_DIR/tsconfig.json" << 'EOF'
{
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "outDir": "temp/vscode-dist",
        "skipLibCheck": true,
        "experimentalDecorators": true,
        "typeRoots": [
            "./node_modules/@types",
            "./assets/Script/types/d.ts"
        ]
    },
    "include": [
        "assets/Script/**/*"
    ],
    "exclude": [
        "node_modules",
        "library",
        "local",
        "temp",
        "build",
        "settings",
        "scriptCodes"
    ]
}
EOF
echo "✅ tsconfig.json 模板已创建"

# 创建 package.json 模板
echo "创建 package.json 模板..."
cat > "$TEMPLATE_DIR/package.json" << 'EOF'
{
    "scripts": {
        "generate-app-extend": "node plugin/generate-app-extend.js",
        "generate-ctrl-map": "node plugin/generate-ctrl-map.js",
        "generate-event-type": "node plugin/generate-event-type.js",
        "generate-view-map": "node plugin/generate-view-map.js",
        "generate-bundle-map": "node plugin/generate-bundle-map.js",
        "check-imports": "node plugin/check-imports.js",
        "build-script": "cd scriptCodes && npm run build"
    }
}
EOF
echo "✅ package.json 模板已创建"

echo ""
echo "======================================"
echo "✅ 模板设置完成！"
echo "======================================"
echo ""
echo "下一步操作："
echo "  1. 检查 template 目录下的文件"
echo "  2. 根据需要修改配置文件"
echo "  3. 运行 npm publish 发布到 npm"
echo ""
