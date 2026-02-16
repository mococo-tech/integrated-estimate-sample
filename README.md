# 見積もり作成システム（サンプル）

Next.js 16 + MUI + Prisma で構築された見積書作成・管理システムの**サンプルプロジェクト**です。

## 本プロジェクトについて

このプロジェクトは、以下の技術要素の動作確認・学習を目的としたサンプル実装です：

- **Next.js App Router** - SSG（Static Site Generation）によるページ生成
- **Route Handlers** - API エンドポイントの実装パターン
- **MUI v7** - Material UI を用いた UI コンポーネント設計
- **認証フロー** - JWT + Cookie によるセッション管理

### アーキテクチャ方針

- **ページは全て SSG（静的生成）** - `/api/*` 以外の動的ルート（`[id]`）は使用しない
- **データ取得はクライアントサイド** - SWR を使用して API からデータを取得
- **ID の受け渡しはクエリパラメータ** - `/documents/edit?id=xxx` 形式を採用

> **Note**: データベースには **SQLite + Prisma** を採用しています。これはローカル開発・動作確認を容易にするための選択のため、本番環境は想定されていません。

## 技術スタック

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| フレームワーク | Next.js 16 (App Router) | SSG のみ（ページ） + Route Handlers（API） |
| UI | MUI v7 (Material UI) | |
| ORM | Prisma 7 | |
| データベース | SQLite | ※テスト用。本番は PostgreSQL/MySQL 推奨 |
| 認証 | JWT (jose) + bcryptjs | HttpOnly Cookie |
| データ取得 | SWR | クライアントサイドフェッチ |

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. データベースのセットアップ

```bash
# マイグレーション実行
npm run db:migrate

# 初期データ投入（管理者ユーザー作成）
npm run db:seed
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## ログイン情報

初期管理者アカウント:

| 項目 | 値 |
|------|-----|
| メールアドレス | admin@example.com |
| パスワード | admin123 |

## ディレクトリ構成

```
.
├── src/
│   ├── app/                              # Next.js App Router（ルーティング）
│   │   ├── (auth)/                       # 認証グループ（未認証ユーザー向け）
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx
│   │   │
│   │   ├── (dashboard)/                  # ダッシュボードグループ（認証必須）
│   │   │   ├── layout.tsx                # Sidebar + Header レイアウト
│   │   │   ├── page.tsx                  # ダッシュボード
│   │   │   ├── companies/                # 顧客管理
│   │   │   │   ├── page.tsx              # 一覧
│   │   │   │   ├── new/page.tsx          # 新規作成
│   │   │   │   └── edit/page.tsx         # 編集 (?id=xxx)
│   │   │   ├── documents/                # 見積もり管理
│   │   │   │   ├── page.tsx              # 一覧
│   │   │   │   ├── new/page.tsx          # 新規作成
│   │   │   │   ├── detail/page.tsx       # 詳細 (?id=xxx)
│   │   │   │   └── edit/page.tsx         # 編集 (?id=xxx)
│   │   │   └── settings/                 # 設定
│   │   │       ├── page.tsx
│   │   │       └── office/page.tsx
│   │   │
│   │   ├── api/                          # === バックエンド（API Routes） ===
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts        # POST: ログイン
│   │   │   │   ├── logout/route.ts       # POST: ログアウト
│   │   │   │   └── me/route.ts           # GET: 現在のユーザー
│   │   │   ├── companies/
│   │   │   │   ├── route.ts              # GET/POST
│   │   │   │   └── [id]/route.ts         # GET/PUT/DELETE
│   │   │   ├── documents/
│   │   │   │   ├── route.ts              # GET/POST
│   │   │   │   ├── [id]/route.ts         # GET/PUT/DELETE
│   │   │   │   └── generate-number/route.ts
│   │   │   └── offices/[id]/route.ts     # GET/PUT
│   │   │
│   │   ├── layout.tsx                    # ルートレイアウト
│   │   ├── providers.tsx                 # MUI ThemeProvider
│   │   └── globals.css
│   │
│   ├── components/                       # === フロントエンド（UIコンポーネント） ===
│   │   ├── ui/                           # 汎用UI
│   │   │   ├── ConfirmDialog.tsx         # 削除確認ダイアログ
│   │   │   └── LoadingSpinner.tsx        # ローディング表示
│   │   ├── layout/                       # レイアウト
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── features/                     # 機能別コンポーネント
│   │       ├── auth/
│   │       │   └── LoginForm.tsx
│   │       ├── companies/
│   │       │   └── CompanyForm.tsx
│   │       └── documents/
│   │           ├── DocumentForm.tsx
│   │           └── QuoteItemTable.tsx
│   │
│   ├── hooks/                            # === フロントエンド（カスタムフック） ===
│   │   ├── useAuth.ts                    # 認証状態管理
│   │   ├── useCompanies.ts               # 顧客データ取得
│   │   └── useDocuments.ts               # 見積もりデータ取得
│   │
│   ├── lib/                              # === バックエンド（サーバーサイド） ===
│   │   ├── db/
│   │   │   └── prisma.ts                 # Prismaクライアント
│   │   └── auth/
│   │       └── auth.ts                   # JWT、パスワードハッシュ、セッション
│   │
│   ├── types/                            # === 共通（型定義） ===
│   │   ├── index.ts                      # エクスポート
│   │   ├── api.ts                        # APIレスポンス型
│   │   ├── company.ts                    # 顧客型
│   │   ├── document.ts                   # 見積もり型
│   │   └── user.ts                       # ユーザー・自社情報型
│   │
│   ├── config/                           # 設定
│   │   └── theme.ts                      # MUIテーマ
│   │
│   └── services/                         # ビジネスロジック（拡張用）
│
├── prisma/
│   ├── schema.prisma                     # DBスキーマ定義
│   ├── seed.ts                           # 初期データ
│   └── dev.db                            # SQLiteファイル
│
├── scripts/                              # スクリプト
│   ├── setup.sh                          # 初期セットアップ (Mac/Linux)
│   ├── setup.bat                         # 初期セットアップ (Windows)
│   └── deploy.ps1                        # IISデプロイ (PowerShell)
│
├── middleware.ts                         # 認証ミドルウェア
├── prisma.config.ts                      # Prisma設定
├── server.js                             # IIS用エントリーポイント
├── web.config                            # IIS設定
└── package.json
```

### SSG + クエリパラメータ パターン

このプロジェクトでは、ページルートに動的セグメント（`[id]`）を使用せず、全てのページを静的生成（SSG）としています。

```
❌ /documents/[id]           → 動的ルート（SSR/ISR が必要）
✅ /documents/detail?id=xxx  → 静的ページ + クエリパラメータ（SSG）
```

**実装パターン:**

```tsx
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  // SWR で API からデータ取得
  const { data } = useDocument(id);
  // ...
}

export default function DetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DetailContent />
    </Suspense>
  );
}
```

> **Note**: `useSearchParams()` を使用するコンポーネントは `Suspense` でラップする必要があります。

### アーキテクチャ概要

**コードベース構成:**

```mermaid
flowchart LR
    subgraph shared["共通"]
        Types["types/"]
    end

    subgraph client["クライアント資産"]
        Pages["app/(auth), (dashboard)/<br>ページコンポーネント"]
        Components["components/"]
        Hooks["hooks/"]
    end

    subgraph server["サーバー資産"]
        API["app/api/<br>Route Handlers"]
        Lib["lib/<br>Auth, Prisma"]
    end

    subgraph data["データ層"]
        Schema["prisma/schema"]
        DB[(SQLite)]
    end

    Types -.->|import| client
    Types -.->|import| server
    Hooks -->|使用| Pages
    Components -->|使用| Pages
    API --> Lib --> Schema --> DB
```

**ランタイムフロー:**

```mermaid
flowchart LR
    subgraph browser["ブラウザ"]
        SSG["SSG ページ<br>(静的HTML/JS)"]
        SWR["SWR<br>(データ取得)"]
        SSG --> SWR
    end

    subgraph server["Next.js サーバー"]
        API["Route Handlers<br>/api/*"]
        Prisma["Prisma Client"]
        API --> Prisma
    end

    DB[(SQLite)]

    SWR <-->|HTTP| API
    Prisma <--> DB
```

**データ取得シーケンス:**

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant S as Next.js サーバー
    participant DB as SQLite

    B->>S: GET /documents/detail?id=xxx<br>(SSG ページ取得)
    S-->>B: 静的 HTML/JS

    Note over B: React マウント<br>useSearchParams() で id 取得

    B->>S: GET /api/documents/xxx<br>(SWR による API コール)
    S->>DB: SELECT * FROM Document...
    DB-->>S: データ
    S-->>B: JSON レスポンス

    Note over B: UI 更新
```

## 主要ファイルの説明

### バックエンド（サーバーサイド）

| ファイル | 説明 |
|----------|------|
| `src/lib/auth/auth.ts` | JWT生成・検証、パスワードハッシュ（bcrypt）、セッション管理 |
| `src/lib/db/prisma.ts` | Prismaクライアント（シングルトン） |
| `middleware.ts` | `/companies`, `/documents`, `/settings` へのアクセスを認証チェック |

### フロントエンド（クライアントサイド）

| ファイル | 説明 |
|----------|------|
| `src/hooks/useAuth.ts` | ログイン状態の取得、ログイン/ログアウト処理をSWRで管理 |
| `src/hooks/useCompanies.ts` | 顧客一覧取得、検索、ページネーション、CRUD関数 |
| `src/hooks/useDocuments.ts` | 見積もり一覧取得、見積番号生成、CRUD関数 |

### UI コンポーネント

| ファイル | 説明 |
|----------|------|
| `src/components/layout/Sidebar.tsx` | ナビゲーションメニュー |
| `src/components/layout/Header.tsx` | ページタイトル、ユーザーメニュー |
| `src/components/features/documents/QuoteItemTable.tsx` | 見積もり明細の行追加・削除・金額自動計算 |

### 型定義（共通）

| ファイル | 説明 |
|----------|------|
| `src/types/api.ts` | APIレスポンス、エラー型 |
| `src/types/company.ts` | 顧客企業の型 |
| `src/types/document.ts` | 見積もり、明細行の型 |
| `src/types/user.ts` | ユーザー、自社情報の型 |

### API エンドポイント

| エンドポイント | メソッド | 説明 |
|----------------|----------|------|
| `/api/auth/login` | POST | メール・パスワードで認証、JWTをCookieに設定 |
| `/api/auth/logout` | POST | Cookieを削除してログアウト |
| `/api/auth/me` | GET | 現在のログインユーザー情報を返す |
| `/api/companies` | GET/POST | 顧客一覧取得（検索・ページネーション対応）/ 新規作成 |
| `/api/companies/[id]` | GET/PUT/DELETE | 顧客詳細取得 / 更新 / 削除 |
| `/api/documents` | GET/POST | 見積もり一覧取得 / 新規作成（明細含む） |
| `/api/documents/[id]` | GET/PUT/DELETE | 見積もり詳細取得 / 更新 / 削除 |
| `/api/documents/generate-number` | GET | `Q-YYYYMM-NNN` 形式の見積番号を自動生成 |
| `/api/offices/[id]` | GET/PUT | 自社情報取得 / 更新 |

## スクリプト

### NPMスクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run db:migrate` | DBマイグレーション |
| `npm run db:seed` | 初期データ投入 |
| `npm run db:studio` | Prisma Studio起動 |

### シェルスクリプト

| スクリプト | 説明 |
|------------|------|
| `scripts/setup.sh` | Mac/Linux 初期セットアップ |
| `scripts/setup.bat` | Windows 初期セットアップ |
| `scripts/deploy.ps1` | IIS デプロイ |

### IIS デプロイ

#### 必要条件

- Windows Server 2016以降
- IIS 10.0以降
- Node.js (LTS)
- [iisnode](https://github.com/Azure/iisnode/releases)
- [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)

#### デプロイ手順

```powershell
# 1. ビルド
npm run build

# 2. デプロイスクリプト実行
.\scripts\deploy.ps1 -TargetPath "C:\inetpub\wwwroot\quote-system"

# 3. IIS マネージャーで設定
#    - アプリケーションプール: マネージコードなし
#    - 物理パス: C:\inetpub\wwwroot\quote-system
```

#### 構成ファイル

| ファイル | 説明 |
|----------|------|
| `server.js` | Node.js エントリーポイント（IIS用） |
| `web.config` | IIS + iisnode 設定 |
| `scripts/deploy.ps1` | デプロイ自動化スクリプト |

## 機能一覧

- **認証機能**: ユーザー名/パスワードによるログイン
- **ダッシュボード**: 顧客数・見積もり数の統計表示
- **顧客管理**: 顧客企業のCRUD操作
- **見積もり管理**: 見積書の作成・編集・一覧表示
- **自社情報設定**: 会社名・住所・振込先情報の管理
- **印刷対応**: 見積書の印刷用スタイル

## データモデル

```mermaid
erDiagram
    Office ||--o{ Person : "所属"
    Office ||--o{ Document : "発行"
    Person ||--o{ Document : "担当"
    Company ||--o{ Document : "宛先"
    Document ||--o{ QuoteItem : "明細"

    Office {
        string id PK
        string name "会社名"
        string zipCode "郵便番号"
        string address "住所"
        string phone "電話番号"
        string fax "FAX"
        string email "メール"
        string bankInfo "振込先情報"
        string invoiceNo "インボイス番号"
    }

    Person {
        string id PK
        string name "氏名"
        string email "メール"
        string password "パスワード"
        string role "権限"
        string officeId FK
    }

    Company {
        string id PK
        string name "会社名"
        string zipCode "郵便番号"
        string address "住所"
        string phone "電話番号"
        string email "メール"
        string contactName "担当者名"
        string note "備考"
    }

    Document {
        string id PK
        string documentNo "見積番号"
        string title "件名"
        datetime issueDate "発行日"
        datetime validUntil "有効期限"
        string status "状態"
        decimal subtotal "小計"
        int taxRate "税率"
        decimal taxAmount "消費税"
        decimal totalAmount "合計金額"
        string companyId FK
        string personId FK
        string officeId FK
    }

    QuoteItem {
        string id PK
        int sortOrder "表示順"
        string itemName "品名"
        string description "説明"
        int quantity "数量"
        string unit "単位"
        decimal unitPrice "単価"
        decimal amount "金額"
        string documentId FK
    }
```

## 画面構成

```mermaid
flowchart TB
    subgraph 認証
        Login["/login<br>ログイン画面"]
    end

    subgraph ダッシュボード
        Dashboard["/<br>ダッシュボード"]
    end

    subgraph 顧客管理
        CompanyList["/companies<br>顧客一覧"]
        CompanyNew["/companies/new<br>顧客登録"]
        CompanyEdit["/companies/edit?id=xxx<br>顧客編集"]
    end

    subgraph 見積もり管理
        DocumentList["/documents<br>見積もり一覧"]
        DocumentNew["/documents/new<br>見積もり作成"]
        DocumentDetail["/documents/detail?id=xxx<br>見積もり詳細"]
        DocumentEdit["/documents/edit?id=xxx<br>見積もり編集"]
    end

    subgraph 設定
        Settings["/settings<br>設定メニュー"]
        OfficeSettings["/settings/office<br>自社情報"]
    end

    Login --> Dashboard
    Dashboard --> CompanyList
    Dashboard --> DocumentList
    Dashboard --> Settings

    CompanyList --> CompanyNew
    CompanyList --> CompanyEdit

    DocumentList --> DocumentNew
    DocumentList --> DocumentDetail
    DocumentDetail --> DocumentEdit

    Settings --> OfficeSettings
```

## 見積もり作成フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant UI as 画面
    participant API as API
    participant DB as データベース

    User->>UI: 見積もり作成画面を開く
    UI->>API: GET /api/documents/generate-number
    API->>DB: 最新の見積番号を取得
    DB-->>API: 見積番号
    API-->>UI: 新しい見積番号 (例: Q-202602-001)

    User->>UI: 顧客・明細を入力
    User->>UI: 保存ボタンをクリック
    UI->>API: POST /api/documents
    API->>DB: 見積もりを保存
    API->>DB: 明細を保存
    DB-->>API: 保存完了
    API-->>UI: 成功レスポンス
    UI-->>User: 一覧画面へ遷移
```
