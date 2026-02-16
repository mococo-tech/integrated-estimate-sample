# deploy.ps1 - IIS デプロイスクリプト
# 使用方法: .\deploy.ps1 -TargetPath "C:\inetpub\wwwroot\quote-system"

param(
    [string]$TargetPath = "C:\inetpub\wwwroot\quote-system"
)

Write-Host "=== Next.js IIS デプロイスクリプト ===" -ForegroundColor Cyan

# 1. ビルド
Write-Host "`n[1/4] プロダクションビルド中..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ビルドに失敗しました" -ForegroundColor Red
    exit 1
}

# 2. デプロイ先ディレクトリ作成
Write-Host "`n[2/4] デプロイ先を準備中..." -ForegroundColor Yellow
if (!(Test-Path $TargetPath)) {
    New-Item -ItemType Directory -Path $TargetPath -Force
}

# 3. ファイルをコピー
Write-Host "`n[3/4] ファイルをコピー中..." -ForegroundColor Yellow
$filesToCopy = @(
    ".next",
    "node_modules",
    "prisma",
    "public",
    "src",
    "server.js",
    "web.config",
    "package.json",
    "package-lock.json",
    "middleware.ts",
    "next.config.ts",
    "tsconfig.json"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Write-Host "  コピー中: $file"
        Copy-Item -Path $file -Destination $TargetPath -Recurse -Force
    }
}

# 4. 環境ファイル作成
Write-Host "`n[4/4] 環境設定ファイルを作成中..." -ForegroundColor Yellow
$envContent = @"
NODE_ENV=production
"@
Set-Content -Path "$TargetPath\.env" -Value $envContent

Write-Host "`n=== デプロイ完了 ===" -ForegroundColor Green
Write-Host "デプロイ先: $TargetPath"
Write-Host "`n次の手順:"
Write-Host "1. IIS マネージャーでサイトを作成"
Write-Host "2. アプリケーションプールを「マネージコードなし」に設定"
Write-Host "3. サイトを開始"
