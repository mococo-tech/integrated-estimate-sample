@echo off
REM setup.bat - 初期セットアップスクリプト (Windows)
REM 使用方法: scripts\setup.bat

echo === 見積もり作成システム 初期セットアップ ===

echo.
echo [1/3] 依存関係をインストール中...
call npm install
if errorlevel 1 goto :error

echo.
echo [2/3] データベースをセットアップ中...
call npm run db:migrate
if errorlevel 1 goto :error

echo.
echo [3/3] 初期データを投入中...
call npm run db:seed
if errorlevel 1 goto :error

echo.
echo === セットアップ完了 ===
echo.
echo 開発サーバーを起動するには:
echo   npm run dev
echo.
echo ログイン情報:
echo   メール: admin@example.com
echo   パスワード: admin123
goto :end

:error
echo.
echo エラーが発生しました。
exit /b 1

:end
