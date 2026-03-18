# 框架模板设置脚本 (PowerShell 版本)
# 用于将 cocosTools 的框架文件复制到 cocosFrameworkCli/template 目录

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "setup-config.json"
$TemplateDir = Join-Path $ScriptDir "template"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Cocos Framework Template Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 读取配置文件获取 cocosTools 路径
if (Test-Path $ConfigPath) {
    $Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    if ($Config.cocosToolsPath -is [System.Management.Automation.PSCustomObject]) {
        if ($Config.cocosToolsPath.windows) {
            $CocosTools = $Config.cocosToolsPath.windows
        } else {
            Write-Host "[ERROR] windows path not found in setup-config.json" -ForegroundColor Red
            exit 1
        }
    } else {
        $CocosTools = $Config.cocosToolsPath
    }
    if ([string]::IsNullOrEmpty($CocosTools)) {
        Write-Host "[ERROR] cocosToolsPath is empty in setup-config.json" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[ERROR] setup-config.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "Using cocosTools path: $CocosTools" -ForegroundColor Green
Write-Host ""

# Create template directory
Write-Host "Creating template directory..."
if (!(Test-Path $TemplateDir)) {
    New-Item -ItemType Directory -Path $TemplateDir | Out-Null
}

# Copy scriptCodes
Write-Host "Copying scriptCodes..."
$SrcScriptCodes = Join-Path $CocosTools "scriptCodes"
if (Test-Path $SrcScriptCodes) {
    Copy-Item -Path $SrcScriptCodes -Destination $TemplateDir -Recurse -Force
    Write-Host "[OK] scriptCodes copied" -ForegroundColor Green
} else {
    Write-Host "[WARN] scriptCodes not found" -ForegroundColor Yellow
}

# Copy Script directory
Write-Host "Copying Script directory..."
$TemplateScriptDir = Join-Path $TemplateDir "Script"
if (!(Test-Path $TemplateScriptDir)) {
    New-Item -ItemType Directory -Path $TemplateScriptDir | Out-Null
}

$SrcExtend = Join-Path $CocosTools "assets/Script/Extend"
if (Test-Path $SrcExtend) {
    Copy-Item -Path $SrcExtend -Destination $TemplateScriptDir -Recurse -Force
    Write-Host "[OK] Extend copied" -ForegroundColor Green
}

$SrcAppTs = Join-Path $CocosTools "assets/Script/App.ts"
if (Test-Path $SrcAppTs) {
    Copy-Item -Path $SrcAppTs -Destination $TemplateScriptDir -Force
    Write-Host "[OK] App.ts copied" -ForegroundColor Green
}

$SrcBootstrap = Join-Path $CocosTools "assets/Script/bootstrap.ts"
if (Test-Path $SrcBootstrap) {
    Copy-Item -Path $SrcBootstrap -Destination $TemplateScriptDir -Force
    Write-Host "[OK] bootstrap.ts copied" -ForegroundColor Green
}

$SrcGlobalDts = Join-Path $CocosTools "assets/Script/global.d.ts"
if (Test-Path $SrcGlobalDts) {
    Copy-Item -Path $SrcGlobalDts -Destination $TemplateScriptDir -Force
    Write-Host "[OK] global.d.ts copied" -ForegroundColor Green
}

$SrcTypes = Join-Path $CocosTools "assets/Script/types"
if (Test-Path $SrcTypes) {
    Copy-Item -Path $SrcTypes -Destination $TemplateScriptDir -Recurse -Force
    Write-Host "[OK] types copied" -ForegroundColor Green
}

# Copy plugin directory
Write-Host "Copying plugin directory..."
$SrcPlugin = Join-Path $CocosTools "plugin"
if (Test-Path $SrcPlugin) {
    Copy-Item -Path $SrcPlugin -Destination $TemplateDir -Recurse -Force
    Write-Host "[OK] plugin copied" -ForegroundColor Green
}

# Create tsconfig.json template
Write-Host "Creating tsconfig.json template..."
$TsConfigContent = @'
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
'@
$TsConfigContent | Out-File -FilePath (Join-Path $TemplateDir "tsconfig.json") -Encoding UTF8
Write-Host "[OK] tsconfig.json template created" -ForegroundColor Green

# Create package.json template
Write-Host "Creating package.json template..."
$PackageJsonContent = @'
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
'@
$PackageJsonContent | Out-File -FilePath (Join-Path $TemplateDir "package.json") -Encoding UTF8
Write-Host "[OK] package.json template created" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Template Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check files in template directory"
Write-Host "  2. Modify config files as needed"
Write-Host "  3. Run 'npm publish' to publish to npm"
Write-Host ""
