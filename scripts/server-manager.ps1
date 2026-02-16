<#
.SYNOPSIS
    Node.js サーバーの起動・停止・状態確認

.DESCRIPTION
    IIS リバースプロキシ経由でアクセスされる Node.js サーバーを管理

.PARAMETER Action
    start   - サーバー起動
    stop    - サーバー停止
    restart - サーバー再起動
    status  - 状態確認

.PARAMETER Port
    リッスンポート（デフォルト: 3000）

.EXAMPLE
    .\server-manager.ps1 start
    .\server-manager.ps1 stop
    .\server-manager.ps1 status
    .\server-manager.ps1 start -Port 3001
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action,

    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$NodeExe = Join-Path $ProjectRoot "runtime\node\node.exe"
$ServerJs = Join-Path $ProjectRoot "server.js"
$RuntimeDir = Join-Path $ProjectRoot "runtime"
$PidFile = Join-Path $RuntimeDir "server.pid"
$LogFile = Join-Path $RuntimeDir "server.log"

function Get-ServerPid {
    if (Test-Path $PidFile) {
        return Get-Content $PidFile -Raw | ForEach-Object { $_.Trim() }
    }
    return $null
}

function Test-ServerRunning {
    $pid = Get-ServerPid
    if ($pid) {
        try {
            $process = Get-Process -Id $pid -ErrorAction Stop
            return $process.ProcessName -eq "node"
        } catch {
            return $false
        }
    }
    return $false
}

function Start-Server {
    if (Test-ServerRunning) {
        $pid = Get-ServerPid
        Write-Host "Server is already running (PID: $pid)" -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $NodeExe)) {
        Write-Host "ERROR: Node.js not found at $NodeExe" -ForegroundColor Red
        Write-Host "Run setup-node.ps1 first."
        exit 1
    }

    # runtime ディレクトリ確認
    if (-not (Test-Path $RuntimeDir)) {
        New-Item -ItemType Directory -Path $RuntimeDir | Out-Null
    }

    # 環境変数設定
    $env:NODE_ENV = "production"
    $env:PORT = $Port

    Write-Host "Starting Next.js server..." -ForegroundColor Cyan
    Write-Host "  Node: $NodeExe"
    Write-Host "  Port: $Port"
    Write-Host "  Log:  $LogFile"

    # バックグラウンドで起動
    $process = Start-Process -FilePath $NodeExe `
        -ArgumentList $ServerJs `
        -WorkingDirectory $ProjectRoot `
        -RedirectStandardOutput $LogFile `
        -RedirectStandardError $LogFile `
        -PassThru `
        -WindowStyle Hidden

    # PID 保存
    $process.Id | Out-File -FilePath $PidFile -NoNewline

    Start-Sleep -Seconds 2

    if (Test-ServerRunning) {
        Write-Host ""
        Write-Host "Server started successfully!" -ForegroundColor Green
        Write-Host "  PID: $($process.Id)"
        Write-Host "  URL: http://localhost:$Port"
    } else {
        Write-Host "ERROR: Server failed to start" -ForegroundColor Red
        Write-Host "Check log file: $LogFile"
        exit 1
    }
}

function Stop-Server {
    if (-not (Test-ServerRunning)) {
        Write-Host "Server is not running" -ForegroundColor Yellow
        if (Test-Path $PidFile) {
            Remove-Item $PidFile -Force
        }
        return
    }

    $pid = Get-ServerPid
    Write-Host "Stopping server (PID: $pid)..." -ForegroundColor Cyan

    try {
        Stop-Process -Id $pid -Force
        Start-Sleep -Seconds 1
        Write-Host "Server stopped" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to stop server" -ForegroundColor Red
    }

    if (Test-Path $PidFile) {
        Remove-Item $PidFile -Force
    }
}

function Get-ServerStatus {
    if (Test-ServerRunning) {
        $pid = Get-ServerPid
        $process = Get-Process -Id $pid
        Write-Host "Server Status: RUNNING" -ForegroundColor Green
        Write-Host "  PID:    $pid"
        Write-Host "  Memory: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB"
        Write-Host "  CPU:    $([math]::Round($process.CPU, 2)) seconds"

        # ポート確認
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Host "  Port:   $Port (listening)"
        }
    } else {
        Write-Host "Server Status: STOPPED" -ForegroundColor Yellow
    }
}

# メイン処理
switch ($Action) {
    "start"   { Start-Server }
    "stop"    { Stop-Server }
    "restart" { Stop-Server; Start-Sleep -Seconds 2; Start-Server }
    "status"  { Get-ServerStatus }
}
