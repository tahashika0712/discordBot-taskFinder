# Discord Task Finder

Discordのメッセージに 📋 リアクションを付けると、AI（Claude）がメッセージ内容からタスク情報を抽出し、Googleスプレッドシートのガンチャート用シートに自動登録するBotです。

## できること

- 📋 リアクションをトリガーに、メッセージ本文・発言者・投稿日時をもとにタスクを抽出
- 1つのメッセージに複数の作業指示が含まれる場合、それぞれ独立したタスクとして分解して登録
- 担当者は `@メンション` があればそれを優先、無ければ発言者を担当者にする
- 「明日まで」「来週の金曜」のような曖昧な期限表現を `YYYY/MM/DD` 形式に変換
- 雑談・質問など、タスクと呼べない内容は自動的に判定してスキップ（`❌` を付与）
- 登録先スプレッドシートはDiscordサーバー（ギルド）ごとに個別設定可能（スラッシュコマンドで切り替え）
- 成功時は `✅`、失敗・スキップ時は `❌` をリアクションで返し、失敗時は理由をリプライで通知

## 全体の流れ

```
Discordメッセージに📋リアクション
        ↓
   Botがメッセージ内容・発言者・投稿日時を取得
        ↓
   そのサーバー用に設定されたスプレッドシートIDを検索
        ↓
   Claude APIでタスク情報を抽出（構造化出力）
        ↓
   タスクと判定されればスプレッドシートに行を追加
        ↓
   ✅ または ❌ をリアクションで返す
```

## 必要なもの

- Discord Bot（トークン、Message Content Intent 有効化）
- [Anthropic](https://console.anthropic.com) のAPIキー
- Google Cloud のサービスアカウント（Google Sheets APIを有効化したプロジェクト）
- Node.js 20 以上（ローカル実行する場合）、または Docker + Docker Compose（本番運用の場合）

## セットアップ

### 1. Discord Bot の準備

1. [Discord Developer Portal](https://discord.com/developers/applications) で新規アプリケーションを作成
2. 「Bot」ページで **Message Content Intent** を有効化し、トークンを取得
3. 「OAuth2 → URL Generator」で以下を選択し、招待URLを発行してサーバーに招待
   - **Scopes**: `bot` と `applications.commands` の両方（片方だけだと動きません）
   - **Bot Permissions**: `View Channels` / `Read Message History` / `Add Reactions` / `Send Messages`

### 2. Anthropic APIキーの取得

[console.anthropic.com](https://console.anthropic.com) でAPIキーを発行し、支払い方法も登録しておく（従量課金）。

### 3. Google Cloud / スプレッドシートの準備

1. Google Cloudプロジェクトを作成し、**Google Sheets API** を有効化
2. サービスアカウントを作成し、JSON鍵をダウンロード → プロジェクト直下に `gcp-service-account.json` として配置
3. 対象のGoogleスプレッドシートを、サービスアカウントの `client_email` に**編集者**権限で共有
4. スプレッドシート内に、以下の見出し行を持つタブを作成（デフォルトのタブ名は `taskbot`。すべて小文字での運用を推奨）

   | 列 | 内容 |
   |---|---|
   | A | 登録日 |
   | B | タスク名 |
   | C | タスク詳細 |
   | D | 担当者 |
   | E | 期限（終了日） |
   | F | ステータス（固定値「未着手」） |
   | G | 元リンク（Discordメッセージへのリンク） |

   ガンチャートの数式・見た目は、このデータ用タブとは**別のタブ**（例: `GanttChart`）を用意し、`QUERY`/`ARRAYFORMULA` などでデータ用タブを参照する構成を推奨します。Botはデータ用タブにしか書き込まないため、ガンチャート側の数式が壊れる心配がありません。

### 4. 環境変数の設定

`.env.example` を `.env` にコピーして値を埋める。

```bash
cp .env.example .env
```

| 変数名 | 説明 |
|---|---|
| `DISCORD_BOT_TOKEN` | Discord Botのトークン |
| `ANTHROPIC_API_KEY` | Anthropic APIキー |
| `CLAUDE_MODEL` | 使用するClaudeモデル（省略時 `claude-opus-4-8`。コスト重視なら `claude-sonnet-5` / `claude-haiku-4-5`） |
| `TRIGGER_EMOJI` | トリガーとなる絵文字（省略時 `📋`） |
| `GOOGLE_APPLICATION_CREDENTIALS` | サービスアカウントJSON鍵へのパス |
| `SHEET_NAME` | データ書き込み先タブ名（省略時 `taskbot`。全サーバー共通の規約） |
| `GUILD_SHEET_STORE_PATH` | サーバーごとのスプレッドシートID対応を保存するJSONファイルのパス（省略時 `./data/guildSheets.json`） |

**スプレッドシートIDは環境変数では設定しません。** Bot導入後、Discord上で `/set-sheet` コマンドを実行してサーバーごとに設定します。

## 使い方（スラッシュコマンド）

サーバー管理権限（Manage Server）を持つメンバーのみ実行できます。

| コマンド | 説明 |
|---|---|
| `/set-sheet url:<スプレッドシートのURLまたはID>` | このサーバーの登録先スプレッドシートを設定。アクセス可否とタブ存在を確認したうえで保存する |
| `/show-sheet` | 現在設定されているスプレッドシートを表示 |
| `/remove-sheet` | このサーバーの設定を削除 |

## ローカルでの起動

```bash
npm install
npm run dev      # tsx watch でホットリロード起動
# または
npm run build && npm run start   # ビルドしてから起動
```

## Dockerでの起動（本番運用）

```bash
docker compose up -d --build
docker compose logs -f
```

- `docker-compose.yml` は `GOOGLE_APPLICATION_CREDENTIALS` をコンテナ内パス（`/run/secrets/gcp-service-account.json`）に上書きし、`gcp-service-account.json` と `data/`（サーバーごとの設定ファイル）をボリュームマウントして永続化しています。
- コードを更新したら `git pull && docker compose up -d --build` で再デプロイしてください。

## プロジェクト構成

```
src/
  index.ts                    起動処理。Discordログイン・スラッシュコマンド登録
  config.ts                   環境変数の読み込み・検証（fail-fast）
  types.ts                    型定義（Task, TaskExtractionResult, SourceMessage）
  discord/
    client.ts                 discord.js Client（Intents・Partials設定）
    reactionHandler.ts         📋リアクション監視〜タスク抽出〜シート登録の中心処理
    commands.ts                スラッシュコマンド定義（set-sheet / remove-sheet / show-sheet）
    commandHandler.ts          スラッシュコマンドの処理
  llm/
    prompt.ts                  タスク抽出用のシステムプロンプト・JSON Schema
    extractTask.ts             Claude APIへの呼び出し（構造化出力）
  sheets/
    sheetsClient.ts            Google Sheets APIとの通信（書き込み・アクセス確認）
  store/
    guildSheetStore.ts         サーバーごとのスプレッドシートID対応（JSONファイル永続化）
Dockerfile
docker-compose.yml
```

## 注意点

- 認証情報（Discordトークン・Anthropic APIキー・GCPサービスアカウント鍵）はすべて `.env` またはファイルマウントで管理し、コードに直書きしない
- 同一メッセージに複数回 📋 を押した場合の重複登録防止は行っていない（シンプルさ優先の設計判断）
- `googleapis` ではなく軽量な `@googleapis/sheets` を使用しています。フルの `googleapis` はメモリの少ない環境（無料枠のVMなど）でTypeScriptビルドがメモリ不足になりやすいため
