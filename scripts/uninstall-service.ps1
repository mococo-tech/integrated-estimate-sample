<#
.SYNOPSIS
    Windows サービスを削除

.PARAMETER ServiceName
    サービス名（デフォルト: NextJsQuoteSystem）

.EXAMPLE
    .\uninstall-service.ps1
    .\uninstall-service.ps1 -ServiceName "MyApp"
#>

param(
    [string]$ServiceName = "NextJsQuoteSystem"
)

$ErrorActionPreference = "Stop"

# 管理者権限チェック
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: 管理者として実行してください" -ForegroundColor Red
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$NssmExe = Join-Path $ProjectRoot "runtime\nssm\win64\nssm.exe"

Write-Host ""
Write-Host "=== サービス削除 ===" -ForegroundColor Cyan
Write-Host "サービス名: $ServiceName"
Write-Host ""

# サービス存在確認
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "サービス '$ServiceName' は存在しません" -ForegroundColor Yellow
    exit 0
}

# 停止
if ($service.Status -eq "Running") {
    Write-Host "サービスを停止中..." -ForegroundColor Yellow
    if (Test-Path $NssmExe) {
        & $NssmExe stop $ServiceName
    } else {
        Stop-Service -Name $ServiceName -Force
    }
    Start-Sleep -Seconds 2
}

# 削除
Write-Host "サービスを削除中..." -ForegroundColor Yellow
if (Test-Path $NssmExe) {
    & $NssmExe remove $ServiceName confirm
} else {
    sc.exe delete $ServiceName
}

Start-Sleep -Seconds 1

# 確認
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host ""
    Write-Host "サービスを削除しました" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "WARNING: サービスの削除に失敗した可能性があります" -ForegroundColor Yellow
    Write-Host "再起動後に完全に削除されることがあります"
}
