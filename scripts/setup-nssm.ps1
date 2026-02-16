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

$NssmBuild = "2.24-101-g897c7ad"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$RuntimeDir = Join-Path $ProjectRoot "runtime"
$NssmDir = Join-Path $RuntimeDir "nssm"

# ダウンロードURL（フォールバック付き）
$DownloadUrls = @(
    "https://www.nssm.cc/ci/nssm-$NssmBuild.zip",
    "https://nssm.cc/ci/nssm-$NssmBuild.zip",
    "https://nssm.cc/release/nssm-2.24.zip"
)
$TempZip = Join-Path $env:TEMP "nssm.zip"

Write-Host "=== NSSM Setup ===" -ForegroundColor Cyan
Write-Host "Version: $NssmBuild"
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

# ダウンロード（複数URLでフォールバック）
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$downloaded = $false
foreach ($url in $DownloadUrls) {
    Write-Host "Downloading from $url ..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $url -OutFile $TempZip -UseBasicParsing
        $downloaded = $true
        Write-Host "  OK" -ForegroundColor Green
        break
    } catch {
        Write-Host "  Failed: $_" -ForegroundColor Gray
    }
}
if (-not $downloaded) {
    Write-Host "ERROR: すべてのダウンロードURLに失敗しました" -ForegroundColor Red
    Write-Host "手動で https://nssm.cc/download からダウンロードし、runtime\nssm\ に配置してください"
    exit 1
}

# 解凍
Write-Host "Extracting..."
Expand-Archive -Path $TempZip -DestinationPath $RuntimeDir -Force

# 解凍後のディレクトリを nssm にリネーム（ディレクトリ名を自動検出）
$extractedDir = Get-ChildItem -Path $RuntimeDir -Directory | Where-Object { $_.Name -like "nssm-*" } | Select-Object -First 1
if ($extractedDir) {
    Rename-Item -Path $extractedDir.FullName -NewName "nssm"
} else {
    Write-Host "ERROR: 解凍後のNSSMディレクトリが見つかりません" -ForegroundColor Red
    exit 1
}

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
