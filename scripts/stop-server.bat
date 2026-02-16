@echo off
REM Node.js サーバー停止スクリプト

setlocal

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set PID_FILE=%PROJECT_ROOT%\runtime\server.pid

if not exist "%PID_FILE%" (
    echo No running server found.
    exit /b 0
)

set /p PID=<"%PID_FILE%"
echo Stopping server (PID: %PID%)...

taskkill /PID %PID% /F >nul 2>&1
if %errorlevel% equ 0 (
    echo Server stopped.
) else (
    echo Server was not running or already stopped.
)

del "%PID_FILE%" >nul 2>&1
echo Done.
