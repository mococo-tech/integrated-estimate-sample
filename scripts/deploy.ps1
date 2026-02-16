<#
.SYNOPSIS
    IIS リバースプロキシ用デプロイスクリプト

.DESCRIPTION
    Next.js アプリケーションを IIS + Node.js (同梱) 構成でデプロイします。
    対話式でデプロイ設定を入力し、以下を自動実行します：
    - Node.js ポータブル版を含めてデプロイ
    - NSSM による Windows サービス化（オプション）
    - IIS サイト作成・ARR プロキシ有効化
    - データベースマイグレーション・初期データ投入

.PARAMETER SkipBuild
    ビルドをスキップ

.PARAMETER SkipNodeSetup
    Node.js セットアップをスキップ

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -SkipBuild -SkipNodeSetup
#>

param(
    [switch]$SkipBuild,

    [switch]$SkipNodeSetup
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# ========================================
# 対話式セットアップ
# ========================================
function Read-Parameter {
    param(
        [string]$Prompt,
        [string]$Default
    )
    $response = Read-Host "$Prompt [$Default]"
    if ([string]::IsNullOrWhiteSpace($response)) { return $Default }
    return $response
}

function Read-YesNo {
    param(
        [string]$Prompt,
        [string]$Default = "Y"
    )
    $response = Read-Host "$Prompt [$Default]"
    if ([string]::IsNullOrWhiteSpace($response)) { $response = $Default }
    return $response -match '^[Yy]'
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next.js IIS デプロイスクリプト" -ForegroundColor Cyan
Write-Host "  (リバースプロキシ + Node.js 同梱)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "設定値を入力してください（Enter でデフォルト値を使用）:" -ForegroundColor Yellow
Write-Host ""

$TargetPath     = Read-Parameter "デプロイ先パス" "C:\inetpub\wwwroot\quote-system"
$Port           = [int](Read-Parameter "Node.js ポート" "3000")
$InstallService = Read-YesNo "Windows サービスとして登録 (Y/N)" "Y"

if ($InstallService) {
    $ServiceName = Read-Parameter "サービス名" "NextJsQuoteSystem"
    $IISSiteName = Read-Parameter "IIS サイト名" "QuoteSystem"
    $IISPort     = [int](Read-Parameter "IIS ポート" "8080")
}

# 管理者権限チェック
if ($InstallService) {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Host ""
        Write-Host "ERROR: サービス登録には管理者として実行してください" -ForegroundColor Red
        exit 1
    }
}

# 設定確認
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "  デプロイ先:       $TargetPath"
Write-Host "  Node.js ポート:   $Port"
if ($InstallService) {
    Write-Host "  サービス登録:     Yes ($ServiceName)"
    Write-Host "  IIS サイト:       $IISSiteName (ポート: $IISPort)"
} else {
    Write-Host "  サービス登録:     No"
}
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

if (-not (Read-YesNo "この設定でデプロイを開始しますか？ (Y/N)" "Y")) {
    Write-Host "デプロイを中止しました" -ForegroundColor Yellow
    exit 0
}
Write-Host ""

$totalSteps = 7
if ($InstallService) { $totalSteps = 10 }

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
    $NodeDir = Join-Path $ProjectRoot "runtime\node"
    Write-Host "[1/$totalSteps] Node.js セットアップをスキップ" -ForegroundColor Gray
}

# ポータブル Node.js を PATH に追加（npm コマンドを使えるようにする）
if (Test-Path "$NodeDir\node.exe") {
    $env:PATH = "$NodeDir;$env:PATH"
    Write-Host "  PATH にポータブル Node.js を追加しました: $NodeDir"
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
# 3. 依存パッケージインストール
# ========================================
$installStep = if ($InstallService) { 3 } else { 2 }
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[$installStep/$totalSteps] 依存パッケージをインストール中..." -ForegroundColor Yellow

    Push-Location $ProjectRoot
    try {
        npm install --production=false
        if ($LASTEXITCODE -ne 0) {
            throw "npm install に失敗しました"
        }
        Write-Host "  Prisma クライアントを生成中..."
        npx prisma generate
        if ($LASTEXITCODE -ne 0) {
            throw "prisma generate に失敗しました"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[$installStep/$totalSteps] 依存パッケージインストールをスキップ" -ForegroundColor Gray
}

# ========================================
# 4. ビルド
# ========================================
$buildStep = if ($InstallService) { 4 } else { 3 }
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
# 5. デプロイ先ディレクトリ準備
# ========================================
$prepStep = if ($InstallService) { 5 } else { 4 }
Write-Host ""
Write-Host "[$prepStep/$totalSteps] デプロイ先を準備中..." -ForegroundColor Yellow

# 既存のサービスを停止
if ($InstallService) {
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "  既存サービスを停止中..."
        try {
            Stop-Service -Name $ServiceName -Force -ErrorAction Stop
            Start-Sleep -Seconds 2
        } catch {
            Write-Host "  (サービス停止をスキップ: $_)" -ForegroundColor Gray
        }
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
# 6. ファイルをコピー
# ========================================
$copyStep = if ($InstallService) { 6 } else { 5 }
Write-Host ""
Write-Host "[$copyStep/$totalSteps] ファイルをコピー中..." -ForegroundColor Yellow

# 毎回更新するファイル（ビルド成果物・設定）
$alwaysCopy = @(
    ".next",
    "prisma",
    "public",
    "src",
    "scripts",
    "server.js",
    "web.config",
    "package.json",
    "next.config.ts",
    "tsconfig.json"
)

# 存在すればスキップするファイル（大容量・変更頻度が低い）
$skipIfExists = @(
    "node_modules",
    "runtime"
)

foreach ($item in $alwaysCopy) {
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

foreach ($item in $skipIfExists) {
    $sourcePath = Join-Path $ProjectRoot $item
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $TargetPath $item
        if (Test-Path $destPath) {
            Write-Host "  $item ... SKIP（既存）" -ForegroundColor Gray
        } else {
            Write-Host "  $item"
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        }
    }
}

# ========================================
# 7. 環境設定
# ========================================
$envStep = if ($InstallService) { 7 } else { 6 }
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
# 8. データベース初期化
# ========================================
$dbStep = if ($InstallService) { 8 } else { 7 }
Write-Host ""
Write-Host "[$dbStep/$totalSteps] データベースを初期化中..." -ForegroundColor Yellow

# デプロイ先で実行するが、CLIツールはプロジェクトルートの node_modules から直接呼び出す
$PrismaBin = Join-Path $ProjectRoot "node_modules\.bin\prisma.cmd"
$TsxBin = Join-Path $ProjectRoot "node_modules\.bin\tsx.cmd"

Push-Location $TargetPath
try {
    # プロジェクトルートの node_modules をモジュール解決パスに追加
    $env:NODE_PATH = Join-Path $ProjectRoot "node_modules"

    # マイグレーション実行
    Write-Host "  マイグレーション実行中..."
    & $PrismaBin migrate deploy --config prisma/prisma.config.ts
    if ($LASTEXITCODE -ne 0) {
        throw "マイグレーションに失敗しました"
    }

    # 初期データ投入
    Write-Host "  初期データを投入中..."
    & $TsxBin prisma/seed.ts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  警告: 初期データ投入がスキップされました（既にデータがある可能性があります）" -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}

# ========================================
# 9. サービス登録（オプション）
# ========================================
if ($InstallService) {
    Write-Host ""
    Write-Host "[9/$totalSteps] Windows サービスを登録中..." -ForegroundColor Yellow

    Push-Location $TargetPath
    try {
        & "$TargetPath\scripts\install-service.ps1" -ServiceName $ServiceName -Port $Port
    } finally {
        Pop-Location
    }

    # ========================================
    # 10. IIS 設定
    # ========================================
    Write-Host ""
    Write-Host "[10/$totalSteps] IIS を設定中..." -ForegroundColor Yellow

    # ARR プロキシ有効化
    Write-Host "  ARR プロキシを有効化中..."
    $appcmd = "$env:windir\system32\inetsrv\appcmd.exe"
    & $appcmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: ARR プロキシの有効化に失敗しました" -ForegroundColor Red
        Write-Host "IIS モジュールがインストールされていない可能性があります。" -ForegroundColor Red
        Write-Host ""
        Write-Host "以下を手動でインストールしてください:" -ForegroundColor Yellow
        Write-Host "  1. URL Rewrite:  https://www.iis.net/downloads/microsoft/url-rewrite"
        Write-Host "  2. ARR:          https://www.iis.net/downloads/microsoft/application-request-routing"
        Write-Host ""
        Write-Host "インストール後、再度デプロイを実行してください:"
        Write-Host "  .\scripts\deploy.ps1 -TargetPath `"$TargetPath`" -InstallService -SkipBuild -SkipNodeSetup"
        exit 1
    }
    Write-Host "  ARR プロキシ ... OK"

    # IIS サイト作成
    Import-Module WebAdministration -ErrorAction Stop

    $existingSite = Get-Website -Name $IISSiteName -ErrorAction SilentlyContinue
    if ($existingSite) {
        Write-Host "  IIS サイト '$IISSiteName' ... SKIP（既存）" -ForegroundColor Gray
    } else {
        New-Website -Name $IISSiteName -PhysicalPath $TargetPath -Port $IISPort -Force | Out-Null
        Write-Host "  IIS サイト '$IISSiteName' を作成しました (ポート: $IISPort)"
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
    Write-Host "IIS サイト: $IISSiteName (ポート: $IISPort)"
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
}

Write-Host "動作確認:" -ForegroundColor Cyan
Write-Host "  - Node.js 直接: http://localhost:$Port"
if ($InstallService) {
    Write-Host "  - IIS 経由:     http://localhost:$IISPort"
} else {
    Write-Host "  - IIS 経由:     http://your-iis-site/"
}
Write-Host ""
