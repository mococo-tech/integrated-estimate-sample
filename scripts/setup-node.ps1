<#
.SYNOPSIS
    Node.js ポータブル版をダウンロードしてプロジェクトに配置します

.DESCRIPTION
    - Node.js の Windows x64 版を runtime/node/ にダウンロード
    - サーバーへの Node.js インストール不要で実行可能に

.PARAMETER Version
    ダウンロードする Node.js のバージョン（デフォルト: 22.16.0）

.EXAMPLE
    .\setup-node.ps1
    .\setup-node.ps1 -Version "20.18.0"
#>

param(
    [string]$Version = "22.16.0"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$RuntimeDir = Join-Path $ProjectRoot "runtime"
$NodeDir = Join-Path $RuntimeDir "node"

$NodeZipName = "node-v$Version-win-x64"
$DownloadUrl = "https://nodejs.org/dist/v$Version/$NodeZipName.zip"
$TempZip = Join-Path $env:TEMP "$NodeZipName.zip"

Write-Host "=== Node.js Portable Setup ===" -ForegroundColor Cyan
Write-Host "Version: $Version"
Write-Host "Target: $NodeDir"
Write-Host ""

# runtime ディレクトリ作成
if (-not (Test-Path $RuntimeDir)) {
    New-Item -ItemType Directory -Path $RuntimeDir | Out-Null
    Write-Host "Created: $RuntimeDir"
}

# 既存の node ディレクトリがあれば削除
if (Test-Path $NodeDir) {
    Write-Host "Removing existing Node.js installation..."
    Remove-Item -Recurse -Force $NodeDir
}

# ダウンロード
Write-Host "Downloading Node.js v$Version..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempZip -UseBasicParsing
} catch {
    Write-Host "ERROR: Failed to download Node.js" -ForegroundColor Red
    Write-Host "URL: $DownloadUrl"
    exit 1
}

# 解凍
Write-Host "Extracting..."
Expand-Archive -Path $TempZip -DestinationPath $RuntimeDir -Force

# リネーム
$ExtractedDir = Join-Path $RuntimeDir $NodeZipName
Rename-Item -Path $ExtractedDir -NewName "node"

# 一時ファイル削除
Remove-Item -Path $TempZip -Force

# 確認
$NodeExe = Join-Path $NodeDir "node.exe"
if (Test-Path $NodeExe) {
    $InstalledVersion = & $NodeExe --version
    Write-Host ""
    Write-Host "=== Setup Complete ===" -ForegroundColor Green
    Write-Host "Node.js $InstalledVersion installed to:"
    Write-Host "  $NodeDir"
    Write-Host ""
    Write-Host "Files:"
    Get-ChildItem $NodeDir | Select-Object Name, Length | Format-Table -AutoSize
} else {
    Write-Host "ERROR: node.exe not found" -ForegroundColor Red
    exit 1
}
