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

**Goal**: `/daily-report` の手動実行で `docs/blog/posts/<DATE>.md` が 1 件できる

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
- **成果物**: `SKILL.md` 内の `# 情報ソース` セクション
- **DoD**: Skill 内に全ソースの URL とタグ（`[RSS]`/`[Atom]`/`[API]`/`[JSON]`/`[HTML]`）が揃う

### P1-5. 取得手順の具体化（タグ別）
- [x] **やること**: 各タグでの取得コマンドを `SKILL.md` の手順に追記
  - `[RSS]`/`[Atom]`: WebFetch でそのまま取得
  - `[API]`/`[JSON]`: `curl -s <URL> | jq` でフィールド抽出
  - `[HTML]`: WebFetch で取得 → 本文抽出指示
  - フォールバック順: 指定フォーマット失敗 → `.rss` → `.json` → HTML パース
- **成果物**: `SKILL.md` の「2. 取得」手順を詳細化
- **DoD**: 任意の 1 ソースを取り出して試したとき、Skill の指示だけで取得できる

### P1-6. 重複排除ルールの明文化
- [x] **やること**: URL 正規化ルールを Skill に書く。少なくとも `utm_*` / `fbclid` / `gclid` クエリパラメータを除去、末尾スラッシュ統一、`http→https`
- **成果物**: `SKILL.md` の「3. 重複排除」項
- **DoD**: 同一記事が複数ソースで現れても 1 件に畳める指示が書かれている

### P1-7. 分類ルール（5 ジャンル）の定義
- [x] **やること**: AI / Infra / Backend / Frontend / Others の判定基準を Skill に書く
- **成果物**: `SKILL.md` の「4. 分類」項
- **DoD**: 1 記事を読んだとき、どのジャンルに入るか Skill 指示だけで一意に決まる
- **実績**: 当初「各ジャンル上位 3 件」としたが、実行して薄いと判断し **5 件**に変更

### P1-8. 執筆フォーマットの固定
- [x] **やること**: 各トピックを「H3 見出し（記事タイトルのインラインリンク）＋要約 4〜6 文（何が起きたか／技術的要点／なぜ重要か）」でテンプレ化
- **成果物**: `SKILL.md` の「5. 執筆」項に例文付きで記載
- **DoD**: テンプレに沿った 1 ジャンル分の見本が Skill 内にある
- **実績**: 当初「300〜500 字／ジャンルの箇条書き」としたが、**初心者向けの平易な文体＋ Mermaid 図**のスタイルに変更（コミット 995b8f9）

### P1-9. レポート frontmatter スキーマの確定
- [x] **やること**: `date`（ISO 8601）、`title`（一行ヘッドライン）だけに絞る。`weight` / `share` / `editor_note` は書かない（[[feedback-simple-first]]）
- **成果物**: `SKILL.md` の「# レポートのスキーマ」項
- **DoD**: スキーマが 2 フィールドのみ

### P1-10. 出力先パスとファイル名規約
- [x] **やること**: `docs/blog/posts/YYYY-MM-DD.md` 固定。同日 2 回実行したら上書き
- **成果物**: `SKILL.md` の「6. 書き出し」項
- **DoD**: 日付を渡せば出力先パスが一意に決まる

### P1-11. git commit 規約
- [x] **やること**: メッセージは `report: YYYY-MM-DD` 固定、`git add docs/` で範囲を絞る、`git push` は P1 では任意（手動確認したいので）
- **成果物**: `SKILL.md` の「7. commit」項
- **DoD**: コミットメッセージのフォーマットが明示

### P1-12. 手動実行と検証（DoD ゲート）
- [x] **やること**: `claude` で `/daily-report` を 1 回実行し、`docs/blog/posts/<今日>.md` が生成されることを確認
- **成果物**: 実物の 1 ファイル＋初回コミット
- **DoD**: 5 ジャンルのうち少なくとも 3 ジャンルが埋まっており、リンク切れがない
- **実績**: 2026-07-13 実行。5 ジャンル × 5 件＋ Mermaid 図 4 点を生成（コミット aa827e7）

### P1-振り返り
- [x] 想定との差分・沼ったポイント・改善案を追記 → 下記「メモ・振り返り欄」の P1 節へ

---

## P2 — サイト化＋タイムライン UI

**Goal**: Astro で GitHub Pages 公開。`/` が posts から導出された年→月→日の横スクロール・タイムライン。デザインに妥協しない

> **前提**: SSG は Astro（ARCHITECTURE.md「SSG の選定」節）。既製テーマは使わず HTML/CSS を自前で書く。**タイムラインは posts からビルド時に導出する**（Skill には生成させない = 設計原則 Derived-not-Generated）。

### P2-1. Astro プロジェクトの初期化
- [x] **やること**: `npm create astro@latest . -- --template minimal --typescript strict --no-git --no-install --yes`（`--yes` がないと「空でないディレクトリだが続行するか」で対話待ちになる）。その後 `npm install`。**依存はピン留めする**（`package.json` から `^` を外す）
- **成果物**: `/package.json`、`/package-lock.json`、`/astro.config.mjs`、`/src/`
- **DoD**: `npm run dev` で localhost が 200 で返る。`package.json` に `^` が 1 つもない
- **実績**: Astro 7.0.7 をピン留め。**scaffold をそのままリポジトリで実行すると既存の `README.md` / `.gitignore` を上書きするため、別ディレクトリで生成して必要なファイルだけ持ち込んだ**（`AGENTS.md` / `.vscode/` は持ち込まない）
- **実績（追加）**: scaffold が入れる `"astro": "astro"` スクリプトは削除（`npx astro` で同じことができ、抽象化として何も足していない）。`.github/dependabot.yml` を追加し、npm と GitHub Actions の更新を**月 1 回・1 本の PR にまとめる**設定にした（ARCHITECTURE.md「依存を膨らませないための約束」の実体化）

### P2-2. GitHub Pages 向けのパス設定（落とし穴 3）
- [x] **やること**: `astro.config.mjs` に `site: "https://<user>.github.io"` と `base: "/knowledge-flow"` を設定。サイト内リンクは `import.meta.env.BASE_URL` 経由で組む
- **成果物**: `astro.config.mjs`
- **DoD**: `npm run build && npm run preview` で CSS が当たった状態で表示される（**ここを飛ばすと本番だけ真っ白になる**）
- **実績**: `site: https://newbee1939.github.io` / `base: /knowledge-flow`。dev で `/` が 404、`/knowledge-flow/` が 200 を返すことを実測。生成 HTML のリンクも `/knowledge-flow/...` になっている

### P2-3. Content Collections で docs/ を読む
- [x] **やること**: `src/content.config.ts` に `glob()` ローダーで `docs/blog/posts/*.md` を読むコレクションを定義。スキーマは `date` / `title` の 2 フィールド（Zod）
- **成果物**: `/src/content.config.ts`
- **DoD**: `getCollection()` で既存の `2026-07-13.md` が型付きで取れる。frontmatter を壊すとビルドが落ちる
- **実績**: 両方とも実測で確認。`date` を `not-a-date` に壊すと `InvalidContentEntryDataError` でビルドが失敗する
- **実績（追加）**: **Astro はコレクションが空でも警告だけでビルドを成功させ、記事ゼロのページを出力することが判明**（`docs/` のパスがずれると空のサイトが静かに公開される）。`src/lib/posts.ts` の `getPosts()` で **0 件ならビルドを止める**ガードを追加。loader のパスをわざとずらして、終了コード 1 で落ち `dist/` が生成されないことを実測
- **注意**: コンテンツは `node_modules/.astro/data-store.json` にキャッシュされる。ローカルでは古いキャッシュのせいで異常に気づかず、**CI で初めて壊れる**ことがある。検証時は `rm -rf .astro node_modules/.astro` してから

### P2-4. Mermaid をビルド時に SVG 化（落とし穴 4）
- [x] **やること**: `rehype-mermaid` 系で ` ```mermaid ` ブロックをビルド時に SVG へ変換する。**クライアント JS は入れない**。ヘッドレスブラウザが必要になるので、CI での実行コストを測る
- **成果物**: `astro.config.mjs` の `markdown.rehypePlugins`
- **DoD**: `/blog/2026-07-13/` の 4 つの図が、JS 無効のブラウザでも表示される
- **判断ポイント**: CI が重くなりすぎるなら「図は諦めてコードブロックのまま出す」も可（[[feedback-simple-first]]）。その場合は `SKILL.md` から Mermaid 指示を外す
- **実績**: `rehype-mermaid`（既定の `inline-svg` 戦略）+ `playwright` + `@astrojs/markdown-remark` を採用。DoD 検証のため `src/pages/blog/[slug].astro` と `src/layouts/BaseLayout.astro`（P2-5 の最小実装）も本 PR に含めた — mermaid の SVG 化は記事詳細ページが無いと目視確認できず、単体では DoD を満たせないため
- **実績（つまずき）**: このリポジトリの Astro は Markdown の既定処理系が変わっており、`markdown.rehypePlugins` を指定しただけでは非推奨警告が出るだけで実際には無視される。`@astrojs/markdown-remark` を追加インストールし、`markdown.processor: unified({ rehypePlugins: [...] })` で明示的に指定する必要があった
- **実績（つまずき2）**: Shiki のシンタックスハイライトが `rehype-mermaid` より先に走り、` ```mermaid ` コードブロックを `<pre class="astro-code" data-language="mermaid">` に作り替えてしまうため、`language-mermaid` クラスが失われて変換対象として認識されなかった。`markdown.syntaxHighlight.excludeLangs: ['mermaid']` で Shiki 側から除外して解決
- **CI コスト実測**: mermaid 変換自体のビルド時間への影響は誤差レベル（8 図込みで 4 ページ合計ビルド 1 秒未満）。重いのは Playwright Chromium のダウンロードのみ（Linux で数十〜百数十 MB）。`actions/cache` で `~/.cache/ms-playwright` をキャッシュし、2 回目以降の CI 実行ではダウンロードをスキップするようにした。**「重すぎるので諦める」の閾値には達しなかった**ため、コードブロックへのフォールバックは不採用
- JS 無効の Chromium でスクリーンショットを撮り、4 図が実際に SVG として描画されることを目視確認済み
- **実績（セルフレビューで発覚した重大な欠陥）**: 8 観点でこの PR 自身をレビューしたところ、**Mermaid の描画に失敗しても `npm run build` が exit 0 で成功し、記事本文が空のまま公開される**欠陥が見つかった。Astro の glob loader は Markdown レンダリング時の例外を catch してログに出すだけで処理を続行し、`entry.rendered` は `undefined` のまま保存される（`node_modules/astro/dist/content/loaders/glob.js`）。Chromium 不在の環境で実際にビルドし、本文が空のページが exit 0 で生成されることを再現した。P3 は人間レビュー無しで main に push する設計（[[project_knowledge_flow_p2_decisions]]）なので、これを見逃すと Mermaid 構文が壊れた瞬間に誰も気づけないまま空記事が公開されるところだった。`posts.ts` の「0 件ならビルドを止める」ガードと同じ思想で `[slug].astro` に `post.rendered?.html` の有無をチェックするガードを追加して解決（コミット ad031b5）
- **実績（同時に発覚した副次的な問題）**: `excludeLangs: ['mermaid']` が Astro の既定値 `['math']` を配列ごと上書きしていた／`BaseLayout.astro` を導入したのに `index.astro` が未移行で `<head>` が重複／日付表示ロジックが 2 ページで二重管理／ローカルの `npm run build` に Playwright 導入手順が無く CLAUDE.md のセルフレビュー手順が機能しない、の 4 件もあわせて修正（`src/lib/date.ts` を新設、`package.json` に `postinstall` を追加）

### P2-4b. Lint / Format / テスト / CI の導入
- [x] **やること**: Biome（Lint + Format）、Vitest（テスト）、CI ワークフローを入れる
- **成果物**: `biome.json`、`vitest.config.ts`、`.github/workflows/ci.yml`、`.tool-versions`、`src/lib/*.test.ts`、`CLAUDE.md` にルール追記
- **DoD**: PR で `npm run lint` / `npm test` / `npm run build` が CI で回り、違反時に落ちる
- **選定理由（Biome）**: ESLint + Prettier + 各 Astro プラグイン（約 7 依存）に対し Biome は 1 依存で済む。**`prettier-plugin-astro` は最終更新が 2024-07-16 で 2 年放置**されており、「Prettier の方が Astro 対応が成熟」という一般論はもう成り立たない。Biome は 2.5.3（2026-07-08）と活発
- **代償**: Biome の `.astro` 対応は**実験的**。`noUnusedVariables` / `noUnusedImports` / `useConst` は誤検知するため `overrides` で **`.astro` に限って**無効化（`.ts` では有効のまま）
- **注意**: `package.json` は Biome の対象外にした（`npm install` がインデントを書き戻すたびに CI が落ちるため）
- **Node のバージョン管理**: **`.tool-versions` を唯一の真実**にした（`node 24.18.0`）。**mise（ローカル）と `setup-node`（CI）の両方がこのファイルをそのまま読む**。当初 `.nvmrc` を置いたが、**mise は `.nvmrc` を既定で読まない**（idiomatic version files は既定で無効）ため、ローカルが Node 25.6.0・CI が 24 でズレていた。実測して発見し修正
- **削ったもの**: Astro scaffold の `public/favicon.svg`（Astro のロゴであり、モノクロ・ミニマルの方針とも他人のブランドを載せない点とも矛盾する）、`biome.json` / `vitest.config.ts` の既定値と同じ記述

### P2-5. 日次レポートページ
- [x] **やること**: `src/pages/blog/[slug].astro` で posts を静的生成
- **成果物**: `/src/pages/blog/[slug].astro`、`/src/layouts/`
- **DoD**: `/blog/2026-07-13/` が表示される
- **実績**: P2-4（Mermaid の SVG 化）の DoD 検証に記事詳細ページが必須だったため、P2-4 と同じ PR で前倒しして最小実装。`render(post)`（`astro:content`）で本文を描画するだけの素の `BaseLayout.astro`。タイポグラフィ・余白は P2-6 で別途

### P2-6. ベースのタイポグラフィと余白
- [x] **やること**: 本文 line-height、見出しサイズ階層、コンテナ最大幅、余白スケールを CSS 変数で定義。白黒＋極小アクセント。フォントは system-ui、等幅は SF Mono / Menlo
- **成果物**: `/src/styles/`
- **DoD**: 記事ページがデザイン方針（モノクロ・ミニマル・洗練）と一致
- **実績**: `src/styles/global.css` にデザイントークン（色・タイポグラフィ・余白スケール・コンテナ幅）を定義。`BaseLayout.astro` にヘッダー／フッターを追加し、記事ページは `[slug].astro` の `:global()` セレクタで Markdown 本文（見出し・リンク・コードブロック・Mermaid SVG・引用）を整えた。アクセント色（`--color-accent`）はリンクホバーのみに限定

### P2-7. タイムライン UI（posts から導出）
- [x] **やること**: `src/pages/index.astro` で `getCollection()` の結果を年 → 月 → 日に集約し、横スクロール領域に描画。**AI に HTML を書かせない**（設計原則 Derived-not-Generated）
- **成果物**: `/src/pages/index.astro`＋タイムライン CSS
- **DoD**: `docs/blog/posts/` に md を 1 枚足すだけで、**コードを一切変えずに**タイムラインへカードが増える
- **実績**: 集約ロジックは純粋関数 `src/lib/timeline.ts`（`buildTimeline`）に切り出してテスト（`timeline.test.ts`）を併設。`index.astro` は年見出し → 月ラベル → 日カードの横スクロール（`overflow-x: auto` + scroll-snap）を描画するだけ

### P2-8. GitHub Actions ワークフロー（Pages）
- [ ] **やること**: `npm ci` → `astro build` → `actions/deploy-pages` の構成。トリガーは `push: branches: [main]` と `workflow_dispatch`
- **成果物**: `/.github/workflows/pages.yml`
- **DoD**: main への push でビルドが緑、Pages にデプロイされる
- **実績**: `pages.yml` を実装済み（公式スターターワークフローと同じ configure-pages → build → upload-pages-artifact → deploy-pages 構成。Playwright キャッシュは ci.yml と共通）。**DoD の検証は P2-9（Pages 有効化、ユーザー操作）が済んでから**

### P2-9. GitHub Pages の有効化（リポジトリ設定）
- [ ] **やること**: Settings → Pages → Source を「GitHub Actions」に
- **成果物**: リポジトリ設定の変更
- **DoD**: 公開 URL が発行される
- **注記**: **AI 単独不可。ユーザーに依頼**

### P2-10. 本番公開とレスポンシブ検証
- [ ] **やること**: 公開 URL で表示確認、コンソールエラーゼロ、320 / 768 / 1280 / 1920 px で目視
- **成果物**: スクリーンショット or 確認メモ
- **DoD**: 4 ブレークポイントで破綻なし

### P2-振り返り
- [ ] 想定との差分・沼ったポイント・改善案を追記。**依存が増えすぎて苦痛なら Hugo への差し替えを発議**（ARCHITECTURE.md「この決定は可逆」）

---

## P3 — 自動化

**Goal**: GitHub Actions の cron で毎朝 `/daily-report` が走る

> **前提**: 実行基盤は GitHub Actions + `CLAUDE_CODE_OAUTH_TOKEN`（ARCHITECTURE.md「AI の実行基盤」節）。API 従量課金ではなくサブスク枠で動かす。

### P3-1. Claude GitHub App の導入と OAuth トークンの登録
- [ ] **やること**: (1) [Claude GitHub App](https://github.com/apps/claude) をリポジトリにインストール（**落とし穴 1 の対策。これがないと bot のコミットで Pages がビルドされない**）。(2) ローカルで `claude setup-token` を実行し、GitHub Secrets に `CLAUDE_CODE_OAUTH_TOKEN` として登録
- **成果物**: GitHub App のインストール＋リポジトリ Secrets
- **DoD**: Secrets に登録済み、App がリポジトリに入っている
- **注記**: **AI 単独不可。ユーザーに依頼**

### P3-2. SKILL.md は commit までで据え置く（落とし穴 6）
- [x] **やること**: **何も変えない、という判断を記録する。** `SKILL.md` に `git push origin main` を足したくなるが、**足してはいけない**。ローカルで手動実行したときにも main へ直接 push してしまい、「main への手動 push 禁止」ルールを破る。push は P3-3 のワークフロー側プロンプトで指示する
- **成果物**: 判断のメモ（本タスクのチェックのみ）
- **DoD**: `SKILL.md` の手順 7 が commit 止まりのままであることを確認
- **実績**: SKILL.md は変更せず、push の指示は `daily-report.yml` のプロンプトにのみ書いた（2026-07-17 確認）

### P3-3. 日次ワークフローの作成（落とし穴 5・6・7）
- [ ] **やること**: `anthropics/claude-code-action@v1` を使う
  - `anthropic_api_key: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`
  - `prompt: "/daily-report を実行し、完了後に main へ push する"` ← **push はここで指示する**（落とし穴 6）
  - `actions/checkout` を先に走らせて `.claude/skills/` を読ませる
  - `env: TZ: Asia/Tokyo`（落とし穴 5）
  - **書き込み範囲は `docs/` のみ**（落とし穴 2 の安全弁）
- **成果物**: `/.github/workflows/daily-report.yml`
- **DoD**: `workflow_dispatch` の手動実行で `docs/blog/posts/<DATE>.md` が **main に push される**
- **注意**: このアクションの**既定挙動は「`claude/` ブランチを作って push」**で、main には push しない（落とし穴 7）。プロンプトでの指示だけで main 直 push になるかは**やってみないと分からない**。ならなければ代替案（`claude/` ブランチ → `gh pr merge --auto --squash`）に切り替える。**ワークフローに `- run: git push` ステップを足すのは NG**（`GITHUB_TOKEN` になり Pages が起動しない）
- **実績**: `daily-report.yml` を実装済み。`anthropics/claude-code-action` v1.0.176（コミットハッシュでピン留め）、認証は公式入力の `claude_code_oauth_token`（ARCHITECTURE.md 記載の `anthropic_api_key` 渡しではなく、action.yml が定義する専用入力を使用）。プロンプトで main 直 push と `docs/` 限定を指示、`claude_args: --allowedTools` で Bash / WebFetch 等を許可。**DoD の検証（workflow_dispatch 実行）は P3-1（Secrets 登録、ユーザー操作）が済んでから**

### P3-4. 「push → Pages 自動ビルド」の連鎖を検証（落とし穴 1）
- [ ] **やること**: P3-3 を手動実行し、**その push によって `pages.yml` が自動で走ったか**を Actions のログで確認する。走っていなければ、Claude GitHub App のトークンで push できていない
- **DoD**: 日次ワークフロー実行 → Pages ビルド → 公開サイトに当日分が出る、が**人手を介さず**通る
- **重要**: **ここが P3 の本当の DoD。** 「レポートがコミットされた」だけでは自動化は完成していない。ジョブが緑でもサイトが更新されていなければ失敗

### P3-5. JST 深夜のスケジュール定義
- [ ] **やること**: 毎日深夜 02:00 JST（= 前日 17:00 UTC）の cron を設定。cron 式は **UTC で書く**
- **成果物**: `daily-report.yml` の `schedule:` 節
- **DoD**: 翌朝に実行ログが残り、サイトが更新されている
- **実績**: 当初 07:00 JST（`cron: '0 22 * * *'`）で組んだが、深夜 02:00 JST（`cron: '0 17 * * *'`）に変更。`TZ: Asia/Tokyo` は `daily-report.yml` に定義済み。DoD の確認は P3-1 完了後の初回実行時

### P3-6. 失敗時のリカバリ手順
- [x] **やること**: 取得失敗 → そのソースを省略（SKILL.md の「注意」どおり）。3 日連続で失敗したソースには除外候補マークを付ける指示を書く
- **成果物**: `.claude/skills/daily-report/SKILL.md` の「# 注意」拡張
- **DoD**: 連続失敗でも勝手に削除はせず、人間レビューに回す
- **実績**: 連続失敗回数を `.claude/skills/daily-report/failures.json`（キー: ソースの URL、値: 連続失敗回数）に記録する運用を追加。3 回連続失敗で `# 情報ソース` の該当行末尾に `⚠️除外候補` マークを付けるが、**行の削除はしない**（人間レビューに委ねる）ことを明記

### P3-7. 失敗通知
- [~] **やること**: ワークフロー失敗時に通知する。**トークン失効で cron が黙って落ちるのが最大のリスク**なので、これは「痛みを感じてから」の例外として最初から入れる
- **成果物**: `daily-report.yml` の失敗時ステップ（GitHub Issue 自動作成が最小）
- **DoD**: わざと失敗させると通知が来る
- **スキップ理由（2026-07-18）**: 一度 `if: failure()` で `gh issue create` するステップを実装したが、「失敗したら記事が増えない、それで気づける」という判断でユーザーが不要と判断し削除した。個人開発規模では毎日サイトを見に行く運用でカバーする想定。もし「気づかず数週間止まっていた」が実際に起きたら、そのとき改めて追加する（[[feedback-simple-first]]）

### P3-8. 1 週間連続稼働確認
- [ ] **やること**: 7 日連続で `docs/blog/posts/` に日次ファイルが追加され、**公開サイトにも反映される**ことを確認
- **DoD**: 7 ファイル並び、サイトに 7 日分のカードが出る

---

## P4 — 月次・年次サマリ

**Goal**: `monthly-summary` / `yearly-summary` Skill を追加。月末・年末バッチ

### P4-1. monthly-summary Skill のスケルトン
- [ ] **やること**: 当月の `docs/blog/posts/YYYY-MM-*.md` を読み込んで主要トピックを抽出 → `docs/summaries/YYYY-MM.md` に書く
- **成果物**: `.claude/skills/monthly-summary/SKILL.md`
- **DoD**: 過去 1 ヶ月のデータでサマリが 1 本生成される

### P4-2. 月次サマリのスキーマ
- [ ] **やること**: 「今月のヘッドライン 5 本 → ジャンル別ハイライト → 来月の注目点」構成。frontmatter は日次と同じ `date` / `title` の 2 フィールドに揃える
- **成果物**: `monthly-summary/SKILL.md` のスキーマ項
- **DoD**: 構造が固定され、Content Collections のスキーマに載る

### P4-3. yearly-summary Skill のスケルトン
- [ ] **やること**: 月次サマリ 12 本を素材に年次を組む → `docs/summaries/YYYY.md`
- **成果物**: `.claude/skills/yearly-summary/SKILL.md`
- **DoD**: テストデータで 1 本生成される

### P4-4. 月末・年末バッチのスケジュール
- [ ] **やること**: 月末日 09:00 JST に monthly、12/31 09:00 JST に yearly を発火（cron は UTC で書く）。**日次（07:00 JST）より後に走らせ、当日分の posts を含められるようにする**
- **成果物**: `.github/workflows/summary.yml`
- **DoD**: 翌月初に `docs/summaries/` が追加され、サイトにも反映される
- **注意**: 月末は日次と月次が同日に走る。両方が main に push するので、月次側は実行前に `git pull` すること（さもないと push が弾かれる）

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

### P6-1. publish Skill のスケルトン
- [ ] **やること**: 「当日分レポート → 投稿用テキスト整形 → X API 投稿 → 音声生成」の流れを書く（RSS はビルド時導出なので Skill の仕事ではない）
- **成果物**: `.claude/skills/publish/SKILL.md`
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

- [ ] リンク切れ検査の自動化 — 1 日 25 本の外部リンクを貼るメディアなので、リンクは必ず腐る。週次で全 posts の URL を `curl -o /dev/null -w '%{http_code}'` して 200 以外を Issue に立てる
- [ ] OGP 画像自動生成（ヘッドライン → 画像）
- [ ] サイト内検索（痛みを感じてから。Pagefind など静的検索を検討）
- [ ] `CLAUDE_CODE_OAUTH_TOKEN` の失効監視（P3-7 の失敗通知は削除済みなので未カバー。しばらく運用して実際に気づけないことがあれば検討）
- [ ] 編集者ノート欄の追加（[[feedback-simple-first]] により「痛みを感じてから」）
- [ ] アクセス解析（プライバシー配慮の軽量ツール）

---

## メモ・振り返り欄

### P1 振り返り（2026-07-13）

**想定と違ったこと**
- **ARCHITECTURE.md と SKILL.md の二重管理が即ドリフトした。** 情報ソース一覧・件数・Reddit の取得方式・GCP のフィード URL がすべてズレた。→ ARCHITECTURE.md 側の転記を削除し、SKILL.md を唯一の真実にした
- **執筆フォーマットが薄すぎた。** 当初の「3 件・箇条書き・300〜500 字」では読み物にならず、実行後に「5 件・4〜6 文の解説・Mermaid 図」に変更した
- **Reddit は `www.reddit.com` + 固有 User-Agent + `.rss` でも安定しない。** 6 サブレディット中 5 つがレート制限で空を返した。スキップ扱いで運用する

**設計の穴が 3 つ見つかった**（ARCHITECTURE.md「実装上の落とし穴」に反映済み）
- `docs/index.md` を Skill に毎日再生成させる設計は、AI の出力揺れで過去分が壊れる → 設計原則 `Derived-not-Generated` を追加
- SSG が mkdocs-material のままだと「テーマを入れて打ち消す」構図になる → Astro に変更
- bot のコミットでは Pages が自動ビルドされない（`GITHUB_TOKEN` の仕様）→ Claude GitHub App のトークンを使う
