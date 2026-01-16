# Chrome Extension Starter Kit

TypeScript と webpack を使用して Chrome 拡張機能を開発するためのスターターキット

## 特徴

- TypeScript 対応: 静的型付けによる開発効率とコードの品質向上
- webpack 導入済み: TypeScript ファイルを JavaScript にコンパイルしファイルをバンドル
- オートリロード機能: 開発モードでのファイル変更時に自動的に拡張機能をリロード（WebSocket 使用）
- Bootstrap UI: モダンで使いやすいポップアップ UI
- 基本的なファイル構成: 開発をすぐに開始できるよう必要なファイルが揃った状態

## 必要条件

- [Node.js](https://nodejs.org/) (v18.x 以上を推奨)
- [npm](https://www.npmjs.com/) または [yarn](https://yarnpkg.com/)

## クイックスタート

### テンプレートから新しいリポジトリを作成（推奨）

このリポジトリをテンプレートとして使用して，コミット履歴を含まない新しいプロジェクトを開始できます．

GitHub CLI を使用:

```bash
# テンプレートから新しいリポジトリを作成
gh repo create my-extension --template yhotamos/chrome-extension-starter-kit --private --clone
cd my-extension

# 依存関係をインストール
npm install

# 開発モード
npm run watch
```

GitHub UI を使用:

1. [このリポジトリ](https://github.com/yhotamos/chrome-extension-starter-kit)にアクセス
2. 「Use this template」ボタンをクリック
3. 新しいリポジトリ名を入力して作成
4. 作成したリポジトリをクローンして使用

### コミット履歴をリセットして新規プロジェクトとして開始

既存のクローンからコミット履歴を削除して，新しいプロジェクトとして始めることもできます．

```bash
# リポジトリをクローン
git clone https://github.com/yhotamos/chrome-extension-starter-kit my-extension
cd my-extension

# Git履歴を削除
rm -rf .git

# 新しいGitリポジトリとして初期化
git init
git add .
git commit -m "Initial commit"

# 依存関係をインストール
npm install
npm run watch
```

### 通常のクローン（開発・貢献用）

このリポジトリに貢献する場合や，コミット履歴を保持したい場合は通常のクローンを使用します．

```bash
# リポジトリをクローン
git clone https://github.com/yhotamos/chrome-extension-starter-kit
cd chrome-extension-starter-kit

# 依存関係をインストール
npm install

# 開発モード（ファイル変更を自動監視 + オートリロード）
npm run watch

# または，本番用ビルド
npm run build
```

### Chrome に拡張機能を読み込む

1. Chrome で `chrome://extensions/` を開く
2. 「デベロッパーモード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `dist/` ディレクトリを選択

## プロジェクト構成

```
chrome-extension-starter-kit/
├── src/
│   ├── background.ts        # バックグラウンドスクリプト
│   ├── background.dev.ts    # バックグラウンドスクリプト（開発用）
│   ├── content.ts           # コンテンツスクリプト
│   ├── popup.ts             # ポップアップスクリプト
│   ├── popup/               # ポップアップ関連
│   │   └── panel.ts
│   └── utils/               # ユーティリティ関数
│       ├── date.ts          # 日時関連
│       ├── dom.ts           # DOM操作関連
│       ├── permissions.ts   # 権限関連
│       └── reload-tabs.ts   # タブリロード関連
├── public/
│   ├── manifest.dev.json    # 拡張機能マニフェスト（開発用）
│   ├── manifest.meta.json   # 拡張機能マニフェスト（メタ）
│   ├── manifest.prod.json   # 拡張機能マニフェスト（本番用）
│   ├── popup.html           # ポップアップ HTML
│   ├── popup.css            # ポップアップスタイル
│   └── icons/               # アイコン画像
├── scripts/
│   ├── create-zip.mts       # ビルド成果物をZIP化
│   ├── ext-reloader.js      # webpack プラグイン（オートリロード用）
│   ├── publish.mts          # 公開用スクリプト
│   └── reload.ts            # リロード機能
├── releases/                # リリース成果物
├── docs/                    # ドキュメント
└── dist/                    # ビルド成果物（自動生成）
```

## 開発ガイド

### マニフェストファイルの管理

拡張機能の設定はマニフェストファイルで管理されます．このプロジェクトでは，開発用と本番用の 2 つのマニフェストを使用しています．

- `public/manifest.dev.json`: 開発用マニフェスト（オートリロード機能など開発用設定を含む）
- `public/manifest.meta.json`: メタ情報用マニフェスト
- `public/manifest.prod.json`: 本番用マニフェスト（公開時に使用）

ビルドプロセスに応じて，webpack が自動的に適切なマニフェストを `dist/` にコピーします．

### 各ファイルの役割

#### コアスクリプト

- `src/background.ts`: バックグラウンドで常駐し，イベント処理や状態管理を行います．例: API 呼び出し，タブ管理，通知の送信など．
- `src/background.dev.ts`: 開発用バックグラウンドスクリプト（開発時のみ使用）
- `src/content.ts`: Web ページに挿入され，DOM 操作やページとのやり取りを行います．例: ページ内容の解析，要素の追加・変更，スクレイピングなど．
- `src/popup.ts`: ポップアップ（`popup.html`）に関連する処理を記述します．例: UI イベントハンドラー，ユーザーアクションの処理など．

#### ユーティリティ関数

`src/utils/` 配下に汎用的な関数をまとめています．

| ファイル         | 説明         | 主な関数                                 |
| ---------------- | ------------ | ---------------------------------------- |
| `date.ts`        | 日時処理     | `dateTime()` - 日時フォーマット          |
| `dom.ts`         | DOM 操作     | `clickURL()` - 新しいタブで URL を開く   |
| `permissions.ts` | 権限管理     | `getSiteAccessText()` - 権限テキスト変換 |
| `reload-tabs.ts` | タブリロード | タブ関連の処理                           |

使用例:

```typescript
import { dateTime } from "./utils/date";
import { clickURL } from "./utils/dom";

const timestamp = dateTime(); // "2024-03-15 14:30"
clickURL(linkElement); // 新しいタブで開く
```

新しいユーティリティの追加:

1. `src/utils/` に新しいファイルを作成（例: `api.ts`）
2. 関数をエクスポート（JSDoc を付けることを推奨）
3. 必要な場所でインポートして使用

### UI の変更

ポップアップの UI:

- `public/popup.html`: ポップアップの HTML 構造を記述します．
- `public/popup.css`: ポップアップのスタイルを定義します．
- UI 開発については [Bootstrap](https://getbootstrap.com/) を利用しています．必要に応じて追加，変更してください．

アイコン:

- `public/icons/` にアイコンファイルを配置します．
- 使用サイズを揃え，マニフェストファイルで参照してください．

## 開発ワークフロー

### 日常的な開発サイクル

1. Watch モードで起動

   ```bash
   npm run watch
   ```

2. コードを編集

   - `src/` 配下のファイルを編集
   - 保存すると自動でビルドされ，拡張機能が自動リロードされます

3. 動作確認
   - ポップアップやコンソールで確認
   - オートリロード機能により，手動でのリロードは不要です

### よくある開発タスク

#### API 通信を追加する

```typescript
// src/utils/api.ts を作成
export async function fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}

// background.ts で使用
import { fetchData } from "./utils/api";
const data = await fetchData("https://api.example.com/data");
```

#### 特定のサイトでコンテンツスクリプトを実行する

1. `src/content.ts` を編集
2. マニフェストファイル（`public/manifest.dev.json` または `public/manifest.prod.json`）で対象 URL を指定

```json
{
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

## オートリロード機能について

開発モード（`npm run watch`）では，ファイルを保存すると自動的に拡張機能がリロードされます．

### 仕組み

- webpack が watch モードで起動し，ファイル変更を監視
- ビルド完了後，WebSocket サーバー（ポート 6571）にリロード信号を送信
- 拡張機能の background スクリプトが信号を受け取り，`chrome.runtime.reload()` を実行

### 注意事項

- オートリロード機能は開発モードのみで動作します
- 本番ビルド（`npm run build`）では含まれません
- WebSocket サーバーはローカルホスト（localhost:6571）で動作します
- 拡張機能全体が再起動されるため，状態は保持されません
- Service Worker が有効である必要があります
  - `chrome://extensions/` で拡張機能の「Service Worker」の横に「無効」と表示されている場合，「ビューを検証」をクリックして有効化してください
  - Service Worker が無効だと WebSocket 接続ができず，オートリロードが動作しません

## トラブルシューティング

### オートリロードが動作しない

1. Service Worker が有効か確認
   - `chrome://extensions/` で拡張機能の詳細を開く
   - 「Service Worker」の横に「無効」と表示されている場合，「ビューを検証」をクリック
   - DevTools が開き，Service Worker が有効化されます
2. `npm run watch` が正常に起動しているか確認
3. ブラウザのコンソール（または Service Worker の DevTools）で WebSocket 接続エラーがないか確認
4. ポート 6571 が他のプロセスに使用されていないか確認

### ビルドエラーが出る

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 拡張機能が動作しない

1. `chrome://extensions/` でエラーメッセージを確認
2. ブラウザのコンソール（F12）でエラーを確認
3. `manifest.json` の permissions が正しいか確認
4. ビルドが成功しているか確認（`dist/` に成果物があるか）

### 設定が保存されない

1. `chrome.storage` の permissions が `manifest.json` にあるか確認
2. ブラウザのコンソールでエラーを確認
3. `src/settings.ts` の型定義が正しいか確認

## ライセンス

MIT License

## 作者

- yhotta240 (https://github.com/yhotta240)
