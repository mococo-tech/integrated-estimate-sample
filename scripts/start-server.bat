@echo off
REM Node.js サーバー起動スクリプト
REM IIS リバースプロキシ経由でアクセスされる

setlocal

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set NODE_EXE=%PROJECT_ROOT%\runtime\node\node.exe
set SERVER_JS=%PROJECT_ROOT%\server.js
set PID_FILE=%PROJECT_ROOT%\runtime\server.pid
set LOG_FILE=%PROJECT_ROOT%\runtime\server.log

REM Node.js 存在確認
if not exist "%NODE_EXE%" (
    echo ERROR: Node.js not found at %NODE_EXE%
    echo Run setup-node.ps1 first.
    exit /b 1
)

REM 既存プロセス確認
if exist "%PID_FILE%" (
    set /p OLD_PID=<"%PID_FILE%"
    echo Existing server found (PID: %OLD_PID%). Stopping...
    taskkill /PID %OLD_PID% /F >nul 2>&1
    del "%PID_FILE%" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM 環境変数設定
set NODE_ENV=production
set PORT=3000

echo Starting Next.js server...
echo   Node: %NODE_EXE%
echo   Port: %PORT%
echo   Log:  %LOG_FILE%

REM バックグラウンドで起動
cd /d "%PROJECT_ROOT%"
start /b "" "%NODE_EXE%" "%SERVER_JS%" > "%LOG_FILE%" 2>&1

REM PID を取得して保存
timeout /t 2 /nobreak >nul
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list ^| find "PID:"') do (
    echo %%a > "%PID_FILE%"
    echo Server started with PID: %%a
    goto :done
)

:done
echo.
echo Server is running at http://localhost:%PORT%
echo Use stop-server.bat to stop the server.
