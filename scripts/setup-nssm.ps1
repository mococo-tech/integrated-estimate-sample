<#
.SYNOPSIS
    NSSM (Non-Sucking Service Manager) をダウンロードしてプロジェクトに配置

.DESCRIPTION
    NSSM を runtime/nssm/ にダウンロード
    Node.js を Windows サービスとして登録するために使用

.EXAMPLE
    .\setup-nssm.ps1
#>

$ErrorActionPreference = "Stop"

$NssmVersion = "2.24"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$RuntimeDir = Join-Path $ProjectRoot "runtime"
$NssmDir = Join-Path $RuntimeDir "nssm"

$DownloadUrl = "https://nssm.cc/release/nssm-$NssmVersion.zip"
$TempZip = Join-Path $env:TEMP "nssm-$NssmVersion.zip"

Write-Host "=== NSSM Setup ===" -ForegroundColor Cyan
Write-Host "Version: $NssmVersion"
Write-Host "Target: $NssmDir"
Write-Host ""

# runtime ディレクトリ作成
if (-not (Test-Path $RuntimeDir)) {
    New-Item -ItemType Directory -Path $RuntimeDir | Out-Null
}

# 既存の nssm ディレクトリがあれば削除
if (Test-Path $NssmDir) {
    Write-Host "Removing existing NSSM installation..."
    Remove-Item -Recurse -Force $NssmDir
}

# ダウンロード
Write-Host "Downloading NSSM v$NssmVersion..." -ForegroundColor Yellow
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempZip -UseBasicParsing
} catch {
    Write-Host "ERROR: Failed to download NSSM" -ForegroundColor Red
    Write-Host "URL: $DownloadUrl"
    Write-Host "You can manually download from https://nssm.cc/download"
    exit 1
}

# 解凍
Write-Host "Extracting..."
Expand-Archive -Path $TempZip -DestinationPath $RuntimeDir -Force

# リネーム
$ExtractedDir = Join-Path $RuntimeDir "nssm-$NssmVersion"
Rename-Item -Path $ExtractedDir -NewName "nssm"

# 一時ファイル削除
Remove-Item -Path $TempZip -Force

# 確認
$NssmExe = Join-Path $NssmDir "win64\nssm.exe"
if (Test-Path $NssmExe) {
    Write-Host ""
    Write-Host "=== Setup Complete ===" -ForegroundColor Green
    Write-Host "NSSM installed to: $NssmDir"
    Write-Host ""
    Write-Host "Next: Run install-service.ps1 to register as Windows service"
} else {
    Write-Host "ERROR: nssm.exe not found" -ForegroundColor Red
    exit 1
}
