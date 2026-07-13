# TASK

> **ステータス: 確定版。** Phase 構造とタスク粒度は合意済み。これに沿って着手してよい。チェックボックス更新・タスク追加・振り返り追記は本ファイルへ直接コミット。Phase 構造そのものを変える場合は ARCHITECTURE.md の改訂と同期する。

ARCHITECTURE.md のロードマップ（P1〜P6）を、Claude Code が自律的に実行できる粒度に分解したもの。

**運用ルール**
- 1 タスク = 1 PR 相当の小ささを目安に分割
- 各タスクは「やること／成果物／DoD」の 3 点セット。DoD を満たせば次へ
- 上から順に着手。ブロッカーが出たら ARCHITECTURE.md に立ち戻る
- 完了したタスクは `- [x]` に置換。スキップしたものは `- [~]`＋理由
- 「Simple-first」原則（[[feedback-simple-first]]）に従い、迷ったら最小実装を選ぶ
- 進捗が想定外（沼り）になったら、その Phase の末尾の「振り返り」項目に書き残す

---

## P1 — Skill 化

**Goal**: `daily-report.md` の手動実行で `docs/blog/posts/<DATE>.md` が 1 件できる

### P1-1. リポジトリ最小構造の作成
- [x] **やること**: 以下のディレクトリを `mkdir -p` で作成
  - `.claude/skills/`
  - `docs/blog/posts/`
- **成果物**: 空ディレクトリ（`.gitkeep` 不要、後続タスクですぐ埋まる）
- **DoD**: `ls .claude/skills docs/blog/posts` が両方成功

### P1-2. README.md の最小版
- [x] **やること**: プロジェクトの一行説明＋ ARCHITECTURE.md へのリンクだけの README.md を作る
- **成果物**: `/README.md`
- **DoD**: GitHub のリポジトリトップで概要が読める内容

### P1-3. daily-report.md スケルトン作成
- [x] **やること**: ARCHITECTURE.md「daily-report.md（Skill の骨組み）」節をベースに `.claude/skills/daily-report.md` を作成。frontmatter（`description`）、`# 手順`、`# レポートのスキーマ`、`# 注意` を含める（後日 `.claude/skills/daily-report/SKILL.md` に配置修正）
- **成果物**: `.claude/skills/daily-report/SKILL.md`
- **DoD**: `claude` 起動時に `/daily-report` がスキル一覧に出る

### P1-4. 情報ソース節を Skill に展開
- [x] **やること**: ARCHITECTURE.md「## 情報ソース」節の URL＋タグを `daily-report.md` 内に転記（ARCHITECTURE.md と二重管理になるが、Skill 単体で完結させる方を優先）
- **成果物**: `daily-report.md` 内の `## 情報ソース` セクション
- **DoD**: Skill 内に全ソースの URL とタグ（`[RSS]`/`[Atom]`/`[API]`/`[JSON]`/`[HTML]`）が揃う

### P1-5. 取得手順の具体化（タグ別）
- [x] **やること**: 各タグでの取得コマンドを `daily-report.md` 手順に追記
  - `[RSS]`/`[Atom]`: WebFetch でそのまま取得
  - `[API]`/`[JSON]`: `curl -s <URL> | jq` でフィールド抽出
  - `[HTML]`: WebFetch で取得 → 本文抽出指示
  - フォールバック順: 指定フォーマット失敗 → `.rss` → `.json` → HTML パース
- **成果物**: `daily-report.md` の「2. 取得」手順を詳細化
- **DoD**: 任意の 1 ソースを取り出して試したとき、Skill の指示だけで取得できる

### P1-6. 重複排除ルールの明文化
- [x] **やること**: URL 正規化ルールを Skill に書く。少なくとも `utm_*` / `fbclid` / `gclid` クエリパラメータを除去、末尾スラッシュ統一、`http→https`
- **成果物**: `daily-report.md` の「3. 重複排除」項
- **DoD**: 同一記事が複数ソースで現れても 1 件に畳める指示が書かれている

### P1-7. 分類ルール（5 ジャンル）の定義
- [x] **やること**: ai / frontend / backend / infra / others それぞれの判定基準（キーワード例・境界事例）を Skill に書く。各ジャンル上位 3 件まで
- **成果物**: `daily-report.md` の「4. 分類」項
- **DoD**: 1 記事を読んだとき、どのジャンルに入るか Skill 指示だけで一意に決まる

### P1-8. 執筆フォーマット（300〜500 字／ジャンル）の固定
- [x] **やること**: 「リード文 1 文 → 3 トピック箇条書き → 示唆 1〜2 文」の構造をテンプレ化。引用 URL は本文中にインライン Markdown リンクで埋め込む
- **成果物**: `daily-report.md` の「5. 執筆」項に例文付きで記載
- **DoD**: テンプレに沿った 1 ジャンル分の見本が Skill 内にある

### P1-9. レポート frontmatter スキーマの確定
- [x] **やること**: `date`（ISO 8601）、`title`（一行ヘッドライン）だけに絞る。`weight` / `share` / `editor_note` は書かない（[[feedback-simple-first]]）
- **成果物**: `daily-report.md` の「# レポートのスキーマ」項
- **DoD**: スキーマが 2 フィールドのみ

### P1-10. 出力先パスとファイル名規約
- [x] **やること**: `docs/blog/posts/YYYY-MM-DD.md` 固定。同日 2 回実行したら上書き
- **成果物**: `daily-report.md` の「6. 書き出し」項
- **DoD**: 日付を渡せば出力先パスが一意に決まる

### P1-11. git commit 規約
- [x] **やること**: メッセージは `report: YYYY-MM-DD` 固定、`git add docs/` で範囲を絞る、`git push` は P1 では任意（手動確認したいので）
- **成果物**: `daily-report.md` の「8. commit」項
- **DoD**: コミットメッセージのフォーマットが明示

### P1-12. 手動実行と検証（DoD ゲート）
- [ ] **やること**: `claude` で `/daily-report` を 1 回実行し、`docs/blog/posts/<今日>.md` が生成されることを確認
- **成果物**: 実物の 1 ファイル＋初回コミット
- **DoD**: 5 ジャンルのうち少なくとも 3 ジャンルが埋まっており、リンク切れがない

### P1-振り返り
- [ ] 想定との差分・沼ったポイント・改善案を ARCHITECTURE.md か本ファイル末尾に追記

---

## P2 — サイト化＋タイムライン UI

**Goal**: Astro で GitHub Pages 公開。`/` が posts から導出された年→月→日の横スクロール・タイムライン。デザインに妥協しない

> **前提**: SSG は Astro（ARCHITECTURE.md「SSG の選定」節）。既製テーマは使わず HTML/CSS を自前で書く。**タイムラインは posts からビルド時に導出する**（Skill には生成させない = 設計原則 Derived-not-Generated）。

### P2-1. Astro プロジェクトの初期化
- [ ] **やること**: `npm create astro@latest` で最小構成（テンプレートは empty、TypeScript 有効）。バージョンはピン留めする
- **成果物**: `/package.json`、`/astro.config.mjs`、`/src/`
- **DoD**: `npm run dev` で localhost が 200 で返る

### P2-2. Content Collections で docs/ を読む
- [ ] **やること**: `src/content.config.ts` に `glob()` ローダーで `docs/blog/posts/*.md` を読むコレクションを定義。スキーマは `date` / `title` の 2 フィールド（Zod）
- **成果物**: `/src/content.config.ts`
- **DoD**: `getCollection()` で既存の `2026-07-13.md` が型付きで取れる

### P2-3. 日次レポートページ
- [ ] **やること**: `src/pages/blog/[slug].astro` で posts を静的生成。Mermaid コードブロックの描画も通す
- **成果物**: `/src/pages/blog/[slug].astro`、`/src/layouts/`
- **DoD**: `/blog/2026-07-13/` が表示され、Mermaid 図が描画される

### P2-4. ベースのタイポグラフィと余白
- [ ] **やること**: 本文 line-height、見出しサイズ階層、コンテナ最大幅、余白スケールを CSS 変数で定義。白黒＋極小アクセント。フォントは system-ui、等幅は SF Mono / Menlo
- **成果物**: `/src/styles/`
- **DoD**: 記事ページがデザイン方針（モノクロ・ミニマル・洗練）と一致

### P2-5. タイムライン UI（posts から導出）
- [ ] **やること**: `src/pages/index.astro` で `getCollection()` の結果を年→月→日に集約し、横スクロール領域に描画。**LLM に HTML を書かせない**
- **成果物**: `/src/pages/index.astro`＋タイムライン CSS
- **DoD**: posts を 1 件足すだけで（コード変更なしに）タイムラインにカードが増える

### P2-6. GitHub Actions ワークフロー（Pages）
- [ ] **やること**: `npm ci` → `astro build` → `actions/deploy-pages` の構成。トリガーは `push: branches: [main]`
- **成果物**: `/.github/workflows/pages.yml`
- **DoD**: main への push でビルドが緑、Pages にデプロイされる

### P2-7. GitHub Pages の有効化（リポジトリ設定）
- [ ] **やること**: Settings → Pages → Source を「GitHub Actions」に。ユーザー操作なのでセッションで実行できない → ユーザー依頼タスクとして残す
- **成果物**: リポジトリ設定の変更
- **DoD**: 公開 URL が発行される
- **注記**: AI 単独不可。ユーザーに依頼

### P2-8. 本番公開とレスポンシブ検証
- [ ] **やること**: 公開 URL で表示確認、コンソールエラーゼロ、320 / 768 / 1280 / 1920 px で目視
- **成果物**: スクリーンショット or 確認メモ
- **DoD**: 4 ブレークポイントで破綻なし

### P2-振り返り
- [ ] 想定との差分・沼ったポイント・改善案を追記。**依存が増えすぎて苦痛なら Hugo への差し替えを発議**（ARCHITECTURE.md「この決定は可逆」）

---

## P3 — 自動化

**Goal**: GitHub Actions の cron で毎朝 `/daily-report` が走る

> **前提**: 実行基盤は GitHub Actions + `CLAUDE_CODE_OAUTH_TOKEN`（ARCHITECTURE.md「AI の実行基盤」節）。API 従量課金ではなくサブスク枠で動かす。

### P3-1. OAuth トークンの発行と登録
- [ ] **やること**: ローカルで `claude setup-token` を実行し、GitHub Secrets に `CLAUDE_CODE_OAUTH_TOKEN` として登録。**トークン発行と Secrets 登録はユーザー操作**
- **成果物**: リポジトリ Secrets
- **DoD**: Secrets に登録済み
- **注記**: AI 単独不可。ユーザーに依頼

### P3-2. 日次ワークフローの作成
- [ ] **やること**: `anthropics/claude-code-action@v1` を使い、`prompt: /daily-report` で実行。`anthropic_api_key: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` を渡す。`actions/checkout` を先に走らせて `.claude/skills/` を読ませる
- **成果物**: `/.github/workflows/daily-report.yml`
- **DoD**: `workflow_dispatch` の手動実行で `docs/blog/posts/<DATE>.md` が commit される

### P3-3. JST 朝のスケジュール定義
- [ ] **やること**: 毎朝 07:00 JST（= 22:00 UTC 前日）の cron を設定
- **成果物**: `daily-report.yml` の `schedule:` 節
- **DoD**: 翌朝に実行ログが残る

### P3-3. 失敗時のリカバリ手順
- [ ] **やること**: 取得失敗 → そのジャンル省略（ARCHITECTURE.md の注意事項どおり）。3 日連続失敗で除外候補マークを Skill 内のソースリストに追記する指示を書く
- **成果物**: `daily-report.md` の「# 注意」拡張
- **DoD**: 連続失敗で勝手に削除はせず、人間レビューに回す

### P3-4. 通知（任意・最小）
- [ ] **やること**: 失敗時のみ何らかの通知（GitHub Issue 自動作成 or メール）。**痛みを感じてから**追加でも可（[[feedback-simple-first]]）
- **成果物**: 通知設定 or 「不要」判断のメモ
- **DoD**: 判断が記録されている

### P3-5. 1 週間連続稼働確認
- [ ] **やること**: 7 日連続で `docs/blog/posts/` に日次ファイルが追加されることを確認
- **DoD**: 7 ファイル並ぶ

---

## P4 — 月次・年次サマリ

**Goal**: `monthly-summary.md` / `yearly-summary.md` を追加。月末・年末バッチ

### P4-1. monthly-summary.md スケルトン
- [ ] **やること**: 当月の `docs/blog/posts/YYYY-MM-*.md` を読み込んで主要トピックを抽出 → `docs/summaries/YYYY-MM.md` に書く
- **成果物**: `.claude/skills/monthly-summary.md`
- **DoD**: 過去 1 ヶ月のテストデータでサマリが 1 本生成

### P4-2. 月次サマリのスキーマ
- [ ] **やること**: 「今月のヘッドライン 5 本 → ジャンル別ハイライト → 来月の注目点」構成
- **成果物**: `monthly-summary.md` のスキーマ項
- **DoD**: 構造が固定

### P4-3. yearly-summary.md スケルトン
- [ ] **やること**: 月次サマリ 12 本を素材に年次を組む。`docs/summaries/YYYY.md`
- **成果物**: `.claude/skills/yearly-summary.md`
- **DoD**: テストデータで 1 本生成

### P4-4. 月末・年末バッチのスケジュール
- [ ] **やること**: 月末日 09:00 JST に monthly、12/31 09:00 JST に yearly を発火
- **成果物**: スケジュール定義
- **DoD**: 翌月初に summaries が追加される

### P4-5. タイムライン UI への組み込み
- [ ] **やること**: 年カードに「年次サマリへのリンク」、月カードに「月次サマリへのリンク」を追加
- **成果物**: `src/pages/index.astro` の拡張（summaries コレクションを追加）
- **DoD**: 公開サイトでリンクが踏める

---

## P5 — 多言語化（JP/EN）

**Goal**: UI 切替が動く。日次レポートは `.md` と `.en.md` の両方を生成

### P5-1. Astro 内蔵 i18n の有効化
- [ ] **やること**: `astro.config.mjs` の `i18n` に `defaultLocale: "ja"` / `locales: ["ja", "en"]` を設定。ルーティング方針（`/` = JP、`/en/` = EN）を決める
- **成果物**: `astro.config.mjs` の i18n セクション
- **DoD**: `/en/` が 200 で返る

### P5-2. 言語切替 UI
- [ ] **やること**: ヘッダーに JP / EN トグルを配置（モノクロ・ミニマルを維持）
- **成果物**: `src/layouts/` ＋ CSS
- **DoD**: クリックで言語が切り替わる

### P5-3. SKILL.md に英訳手順を追加
- [ ] **やること**: 「6. 書き出し」の後段に「6b. 同内容を英訳して `<DATE>.en.md` に書く」を追加。**英訳は元日本語の意味を保持、機械翻訳調を避ける**
- **成果物**: `.claude/skills/daily-report/SKILL.md` の手順拡張
- **DoD**: 1 日分実行すると `.md` と `.en.md` が両方できる

### P5-4. 英語タイムライン UI 検証
- [ ] **やること**: EN 側でカードのタイトル・本文が英訳版になることを確認
- **DoD**: トップで EN に切替時、英訳が並ぶ

---

## P6 — 配信先拡張

**Goal**: X(JP/EN) 投稿 + Spotify 音声配信が回る

### P6-1. publish.md スケルトン
- [ ] **やること**: 「当日分レポート → 投稿用テキスト整形 → X API 投稿 → 音声生成 → RSS 更新」の流れを書く
- **成果物**: `.claude/skills/publish.md`
- **DoD**: スキル一覧に出る

### P6-2. X(Twitter) 投稿
- [ ] **やること**: JP/EN それぞれ 1 投稿を当日レポートから生成（先頭ヘッドライン＋公開 URL）。X API のキー管理は GitHub Secrets
- **成果物**: 投稿ロジック＋認証手段
- **DoD**: 投稿が反映

### P6-3. TTS（音声生成）
- [ ] **やること**: 当日レポート本文を TTS で `docs/audio/YYYY-MM-DD.mp3` に出力。TTS プロバイダ選定（ElevenLabs / OpenAI TTS / Google Cloud TTS など）
- **成果物**: 音声ファイル＋生成手順
- **DoD**: 5〜10 分の聴ける音声が出る

### P6-4. podcast.xml の生成
- [ ] **やること**: `docs/audio/` の mp3 と posts から RSS（Apple Podcast / Spotify 仕様準拠）を**ビルド時に導出**する Astro エンドポイントを書く（設計原則 Derived-not-Generated）
- **成果物**: `/src/pages/podcast.xml.ts`
- **DoD**: RSS バリデータ（castfeedvalidator など）で通る

### P6-5. Spotify Podcaster 登録
- [ ] **やること**: 公開 RSS URL を Spotify for Podcasters に登録
- **成果物**: 番組ページ
- **DoD**: 配信が確認できる
- **注記**: AI 単独不可。ユーザーに依頼

### P6-6. 配信自動化のスケジュール統合
- [ ] **やること**: daily-report 成功後に publish を連鎖発火（同ワークフロー内の後続 job か、`workflow_run` トリガの別ワークフローか）
- **DoD**: 1 週間連続で投稿＋音声配信が回る

---

## バックログ（Phase 未割当）

- [ ] OGP 画像自動生成（ヘッドライン → 画像）
- [ ] サイト内検索（痛みを感じてから。Pagefind など静的検索を検討）
- [ ] `CLAUDE_CODE_OAUTH_TOKEN` の失効監視（期限切れで P3 の cron が黙って落ちるため）
- [ ] 編集者ノート欄の追加（[[feedback-simple-first]] により「痛みを感じてから」）
- [ ] アクセス解析（プライバシー配慮の軽量ツール）

---

## メモ・振り返り欄

<!-- 各 Phase で気づいたことをここに追記。次回 Phase 計画の素材にする -->
