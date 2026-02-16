#!/bin/bash
# setup.sh - 初期セットアップスクリプト
# 使用方法: ./scripts/setup.sh

set -e

echo "=== 見積もり作成システム 初期セットアップ ==="

# 1. 依存関係インストール
echo ""
echo "[1/3] 依存関係をインストール中..."
npm install

# 2. データベースセットアップ
echo ""
echo "[2/3] データベースをセットアップ中..."
npm run db:migrate

# 3. 初期データ投入
echo ""
echo "[3/3] 初期データを投入中..."
npm run db:seed

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "開発サーバーを起動するには:"
echo "  npm run dev"
echo ""
echo "ログイン情報:"
echo "  メール: admin@example.com"
echo "  パスワード: admin123"
