<#
.SYNOPSIS
    Node.js サーバーを Windows サービスとして登録

.DESCRIPTION
    NSSM を使用して Next.js サーバーを Windows サービスとして登録します。
    - サーバー起動時に自動起動
    - クラッシュ時に自動再起動
    - Services.msc または sc コマンドで管理可能

.PARAMETER ServiceName
    サービス名（デフォルト: NextJsQuoteSystem）

.PARAMETER Port
    リッスンポート（デフォルト: 3000）

.EXAMPLE
    .\install-service.ps1
    .\install-service.ps1 -ServiceName "MyApp" -Port 3001
#>

param(
    [string]$ServiceName = "NextJsQuoteSystem",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

# 管理者権限チェック
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: 管理者として実行してください" -ForegroundColor Red
    Write-Host "PowerShell を「管理者として実行」で開き直してください"
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$RuntimeDir = Join-Path $ProjectRoot "runtime"
$NssmExe = Join-Path $RuntimeDir "nssm\win64\nssm.exe"
$NodeExe = Join-Path $RuntimeDir "node\node.exe"
$ServerJs = Join-Path $ProjectRoot "server.js"
$LogDir = Join-Path $RuntimeDir "logs"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Windows サービス登録" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "サービス名: $ServiceName"
Write-Host "ポート: $Port"
Write-Host ""

# NSSM 存在確認
if (-not (Test-Path $NssmExe)) {
    Write-Host "ERROR: NSSM が見つかりません" -ForegroundColor Red
    Write-Host "先に setup-nssm.ps1 を実行してください"
    exit 1
}

# Node.js 存在確認
if (-not (Test-Path $NodeExe)) {
    Write-Host "ERROR: Node.js が見つかりません" -ForegroundColor Red
    Write-Host "先に setup-node.ps1 を実行してください"
    exit 1
}

# ログディレクトリ作成
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# 既存サービスの確認と削除
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "既存のサービスを削除中..." -ForegroundColor Yellow
    if ($existingService.Status -ne "Stopped") {
        & $NssmExe stop $ServiceName
        Start-Sleep -Seconds 3
    }
    & $NssmExe remove $ServiceName confirm

    # サービスが完全に削除されるまで待機
    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if (-not $svc) {
            Write-Host "  サービスの削除を確認しました"
            break
        }
        Write-Host "  サービスの削除待ち... ($waited 秒)" -ForegroundColor Gray
    }

    # まだ残っている場合はエラー
    $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($svc) {
        Write-Host ""
        Write-Host "ERROR: サービスの削除が完了しませんでした" -ForegroundColor Red
        Write-Host "以下を確認してください:" -ForegroundColor Yellow
        Write-Host "  1. Services.msc（サービス管理画面）を閉じる"
        Write-Host "  2. タスクマネージャーで関連プロセスが残っていないか確認"
        Write-Host "  3. 再度スクリプトを実行"
        Write-Host ""
        Write-Host "それでも解決しない場合は、PC を再起動してから再実行してください"
        exit 1
    }
}

# サービスインストール
Write-Host "サービスをインストール中..." -ForegroundColor Yellow

& $NssmExe install $ServiceName $NodeExe
& $NssmExe set $ServiceName AppParameters $ServerJs
& $NssmExe set $ServiceName AppDirectory $ProjectRoot

# 環境変数
& $NssmExe set $ServiceName AppEnvironmentExtra "NODE_ENV=production" "PORT=$Port"

# ログ設定
$StdoutLog = Join-Path $LogDir "stdout.log"
$StderrLog = Join-Path $LogDir "stderr.log"
& $NssmExe set $ServiceName AppStdout $StdoutLog
& $NssmExe set $ServiceName AppStderr $StderrLog
& $NssmExe set $ServiceName AppStdoutCreationDisposition 4
& $NssmExe set $ServiceName AppStderrCreationDisposition 4
& $NssmExe set $ServiceName AppRotateFiles 1
& $NssmExe set $ServiceName AppRotateBytes 10485760

# 再起動設定（クラッシュ時）
& $NssmExe set $ServiceName AppExit Default Restart
& $NssmExe set $ServiceName AppRestartDelay 5000

# 起動設定
& $NssmExe set $ServiceName Start SERVICE_AUTO_START
& $NssmExe set $ServiceName DisplayName "Next.js Quote System"
& $NssmExe set $ServiceName Description "見積もり作成システム - Next.js Server (Port: $Port)"

# サービス開始
Write-Host "サービスを開始中..." -ForegroundColor Yellow
& $NssmExe start $ServiceName

Start-Sleep -Seconds 3

# 状態確認
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  サービス登録完了!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "サービス名:   $ServiceName"
    Write-Host "状態:         Running"
    Write-Host "URL:          http://localhost:$Port"
    Write-Host "ログ:         $LogDir"
    Write-Host ""
    Write-Host "管理コマンド:" -ForegroundColor Cyan
    Write-Host "  開始:   sc start $ServiceName"
    Write-Host "  停止:   sc stop $ServiceName"
    Write-Host "  状態:   sc query $ServiceName"
    Write-Host "  削除:   .\uninstall-service.ps1"
    Write-Host ""
    Write-Host "または Services.msc で管理できます"
} else {
    Write-Host ""
    Write-Host "WARNING: サービスの開始に問題がある可能性があります" -ForegroundColor Yellow
    Write-Host "ログを確認してください: $LogDir"
}
