<#
.SYNOPSIS
    IIS リバースプロキシ用デプロイスクリプト

.DESCRIPTION
    Next.js アプリケーションを IIS + Node.js (同梱) 構成でデプロイします。
    - Node.js ポータブル版を含めてデプロイ
    - NSSM による Windows サービス化（オプション）
    - IIS はリバースプロキシとして動作

.PARAMETER TargetPath
    デプロイ先パス

.PARAMETER InstallService
    Windows サービスとして登録（管理者権限が必要）

.PARAMETER ServiceName
    サービス名（デフォルト: NextJsQuoteSystem）

.PARAMETER Port
    リッスンポート（デフォルト: 3000）

.PARAMETER SkipBuild
    ビルドをスキップ

.PARAMETER SkipNodeSetup
    Node.js セットアップをスキップ

.EXAMPLE
    .\deploy.ps1 -TargetPath "C:\inetpub\wwwroot\quote-system"
    .\deploy.ps1 -TargetPath "C:\inetpub\wwwroot\quote-system" -InstallService
    .\deploy.ps1 -TargetPath "D:\apps\quote-system" -InstallService -ServiceName "MyQuoteApp" -Port 3001
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetPath,

    [switch]$InstallService,

    [string]$ServiceName = "NextJsQuoteSystem",

    [int]$Port = 3000,

    [switch]$SkipBuild,

    [switch]$SkipNodeSetup
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# サービスインストール時は管理者権限が必要
if ($InstallService) {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Host "ERROR: -InstallService を使用する場合は管理者として実行してください" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next.js IIS デプロイスクリプト" -ForegroundColor Cyan
Write-Host "  (リバースプロキシ + Node.js 同梱)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "デプロイ先: $TargetPath"
Write-Host "ポート: $Port"
if ($InstallService) {
    Write-Host "サービス登録: Yes ($ServiceName)"
}
Write-Host ""

$totalSteps = 5
if ($InstallService) { $totalSteps = 7 }

# ========================================
# 1. Node.js ポータブル版セットアップ
# ========================================
if (-not $SkipNodeSetup) {
    Write-Host "[1/$totalSteps] Node.js ポータブル版をセットアップ中..." -ForegroundColor Yellow

    $NodeDir = Join-Path $ProjectRoot "runtime\node"
    if (-not (Test-Path "$NodeDir\node.exe")) {
        & "$ScriptDir\setup-node.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Node.js セットアップに失敗しました" -ForegroundColor Red
            exit 1
        }
    } else {
        $version = & "$NodeDir\node.exe" --version
        Write-Host "  Node.js $version (既存を使用)"
    }
} else {
    Write-Host "[1/$totalSteps] Node.js セットアップをスキップ" -ForegroundColor Gray
}

# ========================================
# 2. NSSM セットアップ（サービス登録時のみ）
# ========================================
if ($InstallService) {
    Write-Host ""
    Write-Host "[2/$totalSteps] NSSM をセットアップ中..." -ForegroundColor Yellow

    $NssmDir = Join-Path $ProjectRoot "runtime\nssm"
    if (-not (Test-Path "$NssmDir\win64\nssm.exe")) {
        & "$ScriptDir\setup-nssm.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: NSSM セットアップに失敗しました" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  NSSM (既存を使用)"
    }
}

# ========================================
# 3. ビルド
# ========================================
$buildStep = if ($InstallService) { 3 } else { 2 }
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[$buildStep/$totalSteps] プロダクションビルド中..." -ForegroundColor Yellow

    Push-Location $ProjectRoot
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "ビルドに失敗しました"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[$buildStep/$totalSteps] ビルドをスキップ" -ForegroundColor Gray
}

# ========================================
# 4. デプロイ先ディレクトリ準備
# ========================================
$prepStep = if ($InstallService) { 4 } else { 3 }
Write-Host ""
Write-Host "[$prepStep/$totalSteps] デプロイ先を準備中..." -ForegroundColor Yellow

# 既存のサービスを停止
if ($InstallService) {
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService -and $existingService.Status -eq "Running") {
        Write-Host "  既存サービスを停止中..."
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
    }
}

if (Test-Path $TargetPath) {
    # 既存のサーバーを停止（手動起動の場合）
    $stopScript = Join-Path $TargetPath "scripts\server-manager.ps1"
    if (Test-Path $stopScript) {
        Write-Host "  既存サーバーを停止中..."
        try {
            & $stopScript -Action stop
        } catch {
            Write-Host "  (サーバー停止をスキップ)" -ForegroundColor Gray
        }
    }
} else {
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
}

# ========================================
# 5. ファイルをコピー
# ========================================
$copyStep = if ($InstallService) { 5 } else { 4 }
Write-Host ""
Write-Host "[$copyStep/$totalSteps] ファイルをコピー中..." -ForegroundColor Yellow

$itemsToCopy = @(
    ".next",
    "node_modules",
    "prisma",
    "public",
    "src",
    "runtime",
    "scripts",
    "server.js",
    "web.config",
    "package.json",
    "next.config.ts",
    "tsconfig.json"
)

foreach ($item in $itemsToCopy) {
    $sourcePath = Join-Path $ProjectRoot $item
    if (Test-Path $sourcePath) {
        Write-Host "  $item"
        $destPath = Join-Path $TargetPath $item

        if (Test-Path $destPath) {
            Remove-Item -Path $destPath -Recurse -Force
        }

        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    }
}

# ========================================
# 6. 環境設定
# ========================================
$envStep = if ($InstallService) { 6 } else { 5 }
Write-Host ""
Write-Host "[$envStep/$totalSteps] 環境設定中..." -ForegroundColor Yellow

# .env ファイル作成
$envContent = @"
NODE_ENV=production
PORT=$Port
JWT_SECRET=$(([guid]::NewGuid()).ToString('N'))
"@
$envPath = Join-Path $TargetPath ".env"
Set-Content -Path $envPath -Value $envContent
Write-Host "  .env ファイルを作成しました"

# runtime/logs ディレクトリ確認
$logsDir = Join-Path $TargetPath "runtime\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# ========================================
# 7. サービス登録（オプション）
# ========================================
if ($InstallService) {
    Write-Host ""
    Write-Host "[7/$totalSteps] Windows サービスを登録中..." -ForegroundColor Yellow

    Push-Location $TargetPath
    try {
        & "$TargetPath\scripts\install-service.ps1" -ServiceName $ServiceName -Port $Port
    } finally {
        Pop-Location
    }
}

# ========================================
# 完了
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  デプロイ完了!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "デプロイ先: $TargetPath"
Write-Host ""

if ($InstallService) {
    Write-Host "Node.js サーバー: Windows サービスとして起動済み" -ForegroundColor Green
    Write-Host "  サービス名: $ServiceName"
    Write-Host "  管理: sc start/stop $ServiceName または Services.msc"
    Write-Host ""
    Write-Host "次の手順:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. IIS で ARR を有効化（初回のみ）:"
    Write-Host '   %windir%\system32\inetsrv\appcmd.exe set config -section:system.webServer/proxy /enabled:"True" /commit:apphost'
    Write-Host ""
    Write-Host "2. IIS マネージャーでサイトを作成:"
    Write-Host "   - 物理パス: $TargetPath"
    Write-Host ""
} else {
    Write-Host "次の手順:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "【推奨】サービスとして登録する場合:" -ForegroundColor Yellow
    Write-Host "  cd $TargetPath"
    Write-Host "  .\scripts\install-service.ps1"
    Write-Host ""
    Write-Host "【手動起動】の場合:"
    Write-Host "  cd $TargetPath"
    Write-Host "  .\scripts\server-manager.ps1 start"
    Write-Host ""
    Write-Host "IIS 設定:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. ARR を有効化（初回のみ）:"
    Write-Host '   %windir%\system32\inetsrv\appcmd.exe set config -section:system.webServer/proxy /enabled:"True" /commit:apphost'
    Write-Host ""
    Write-Host "2. IIS マネージャーでサイトを作成:"
    Write-Host "   - 物理パス: $TargetPath"
    Write-Host ""
}

Write-Host "動作確認:" -ForegroundColor Cyan
Write-Host "  - Node.js 直接: http://localhost:$Port"
Write-Host "  - IIS 経由:     http://your-iis-site/"
Write-Host ""
