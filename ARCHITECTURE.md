# knowledge-flow — Tech News Timeline

> **ステータス: 確定版。** これは合意済みの設計仕様。方針を変えるときは本ファイルを直し、PR で履歴を残す。実装中の細かい揺らぎは TASK.md 側で吸収する。

「今日のテックを線で理解できる」一人運営のテックニュースメディア。日次レポートを **年 → 月 → 日のタイムライン** で横断表示する。

**作るもの**: 毎朝 AI が技術ニュースを集めて要約し、Markdown として溜め、それを静的サイトとして公開する。**人間の作業はゼロを目指す。**

---

## 3 つの方針

**コンテンツ生成は Claude Code Skill にやらせる。** 記事の取得・分類・要約・執筆はすべて Skill（`SKILL.md` に書いた自然言語の指示書）が行う。ここに手続き的なコードは書かない。

**サイトは自分で書く。** テンプレートと CSS は Astro で自作する。既製テーマは使わない。テーマの既定デザインを打ち消す CSS を書くくらいなら、最初から書いたほうが速いし読みやすい。

**デザインはモノクロ・ミニマル・洗練。** 白黒（＋ごく小さなアクセント色）。装飾を足さず、**余白とタイポグラフィの精度**で勝負する。年 → 月 → 日を横スクロールするタイムラインが主役。

---

## 全体の流れ

```
毎朝 07:00 JST（GitHub Actions / cron ※P3）
  └─ /daily-report Skill を実行
       ├─ 情報ソースから記事を取得 ─ WebFetch / curl
       ├─ AI / Infra / Backend / Frontend / Others に分類
       ├─ 各ジャンル 5 件を選んで執筆（JP/EN 両方 ※P5）
       ├─ docs/blog/posts/YYYY-MM-DD.md (.en.md) を書く
       └─ main に直接コミット & push  ← 一覧やタイムラインには触らない
                │
                │ ※ Claude GitHub App のトークンで push する（後述の落とし穴 1）
                ▼
GitHub Pages（main への push で自動ビルド）
  └─ Astro の Content Collections が docs/ 配下の markdown を読む
       ├─ /                  … タイムライン（posts から自動導出、JP/EN 切替）
       ├─ /blog/YYYY-MM-DD/  … 日次レポート
       ├─ /summaries/...     … 月次・年次サマリ（P4）
       └─ /podcast.xml       … Spotify 用 RSS（P6）

月末 / 年末（GitHub Actions / cron ※P4）
  └─ /monthly-summary, /yearly-summary → docs/summaries/

配信（GitHub Actions / cron ※P6）
  └─ /publish → X(JP/EN) 投稿 + Spotify 音声配信
```

## 設計原則

1. **Skill-as-Pipeline** — 記事の取得・分類・執筆・配信は Claude Code Skill で完結させる
2. **Markdown-as-Database** — データベースを持たない。`docs/` 配下の markdown がデータそのもの
3. **Derived-not-Generated** — **一覧・タイムライン・RSS は posts から「ビルド時に計算」する。AI に書かせない。** AI の出力は毎回わずかに揺れるので、毎日書き換えさせると過去分が静かに壊れる
4. **GitHub-as-Infra** — サーバーを持たない。GitHub の Actions / Pages / Repo だけで完結させる
5. **Design-as-Product** — タイポグラフィと余白に妥協しない。ここがこのメディアの価値
6. **Add only when it hurts** — 抽象化も依存追加も、実際に痛みを感じてから

---

## ファイル構成

**`docs/` = データ（Skill だけが書く）／`src/` = サイトのコード（人と Claude が書く）。この境界を跨がせない。**

```
knowledge-flow/
├── .claude/skills/
│   ├── daily-report/SKILL.md        # 日次（メイン）
│   ├── monthly-summary/SKILL.md     # 月末バッチ（P4）
│   ├── yearly-summary/SKILL.md      # 年末バッチ（P4）
│   └── publish/SKILL.md             # X / Spotify 配信（P6）
├── docs/                            # ← データ層。Skill だけが書く
│   ├── blog/posts/YYYY-MM-DD[.en].md
│   ├── summaries/YYYY[-MM][.en].md  # P4
│   └── audio/YYYY-MM-DD.mp3         # TTS 音声（P6）
├── src/                             # ← サイト層。Skill は触らない（P2）
│   ├── content.config.ts            # Content Collections（docs/ を読む定義）
│   ├── pages/
│   │   ├── index.astro              # タイムライン（posts から導出）
│   │   ├── blog/[slug].astro        # 日次レポート
│   │   └── podcast.xml.ts           # Spotify 用 RSS（P6）
│   ├── layouts/
│   └── styles/                      # モノクロ・ミニマルの CSS（自前）
├── astro.config.mjs
├── package.json / package-lock.json
├── .github/workflows/
│   ├── pages.yml                    # Astro ビルド → Pages デプロイ（P2）
│   └── daily-report.yml             # cron で Skill 実行（P3）
├── ARCHITECTURE.md
├── TASK.md
└── README.md
```

`scripts/`、`apps/`、`pyproject.toml` は**作らない**。`package.json` は Astro のために作る（当初の「作らない」方針は撤回した。理由は「SSG の選定」を参照）。

> `docs/` という名前は GitHub Pages の旧来の「/docs フォルダをそのまま公開する」機能を連想させるが、**本プロジェクトはその機能を使わない**（Actions からデプロイする）。`docs/` はただのデータ置き場。

---

## Skill の内容・情報ソース

**唯一の真実は `.claude/skills/daily-report/SKILL.md`。** 手順・執筆ルール・レポートのスキーマ・情報ソース一覧は、すべてそちらに書く。**本ドキュメントには転記しない**（二重管理は必ずドリフトするため。実際に一度やって、件数もソース一覧もズレた）。

各 Phase で追加する Skill も同様に `.claude/skills/<name>/SKILL.md` を唯一の真実とする。

---

## コンテンツの原則

一次ソースの要約と論評であって、**転載ではない**。

- 各トピックは必ず**元記事へのリンク**を見出しに持つ（`SKILL.md` の執筆ルールで担保）
- 原文の丸写しはしない。自分の言葉で書き直す
- 有料記事・会員限定記事は、公開されている範囲だけを扱う

---

## ロードマップ

| Phase | DoD（これができたら次へ） |
|---|---|
| **P1 — Skill 化** | `/daily-report` の手動実行で `docs/blog/posts/<DATE>.md` が 1 件できる |
| **P2 — サイト化＋タイムライン UI** | Astro で GitHub Pages 公開。`/` が posts から導出された年 → 月 → 日の横スクロール・タイムライン。**デザインに妥協しない** |
| **P3 — 自動化** | GitHub Actions の cron で毎朝 `/daily-report` が走り、サイトが自動更新される |
| **P4 — 月次・年次サマリ** | `monthly-summary` / `yearly-summary` Skill を追加。月末・年末バッチ |
| **P5 — 多言語化（JP/EN）** | Astro 内蔵 i18n で UI 切替。`daily-report` が `.md` と `.en.md` の両方を生成 |
| **P6 — 配信先拡張** | `publish` Skill 追加 → X(JP/EN) 投稿 + Spotify 音声配信（TTS → `docs/audio/` + `/podcast.xml`、Spotify は RSS から自動取得） |

各 Phase は**既存 Phase への小さな差分**だけにする。「思ったより足りない」と感じたら、この表に戻ってきて更新する。

---

## 実装上の落とし穴（先に決めておくこと）

架空の設計ではなく実際に踏む地雷。P2 / P3 に着手する前にここを読む。

### 1. bot のコミットは、既定では Pages のビルドを起こさない

GitHub は**無限ループを防ぐため、`GITHUB_TOKEN` で push されたコミットでは他のワークフローを起動しない**（[公式ドキュメント](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)）。つまり素朴に組むと、毎朝レポートがコミットされてもサイトが永遠に更新されない。

**対策**: 日次ワークフローは **Claude GitHub App のトークン**で push する（claude-code-action が既定でそうする）。App のトークンなら push イベントが正常に発火し、`pages.yml` が動く。

### 2. main への直接コミットは、この bot に限って許可する

グローバルの作業ルールでは「`git push` to main は禁止」だが、**それは対話セッションでの人間（と Claude）の手動 push に対する規則**。日次レポートの bot は main に直接コミットする。PR を挟むと毎朝マージ作業が発生し、「人間の作業ゼロ」という目的に反する。

**安全弁**: ワークフロー内のコミット範囲を `git add docs/` に限定する。bot が `src/` や `.github/` を書き換えることは構造的にありえないようにしておく。

### 3. GitHub Pages はサブディレクトリ公開になる

`https://<user>.github.io/knowledge-flow/` で公開されるため、`astro.config.mjs` に `site` と `base` の設定が要る。**これを忘れると CSS と画像が全部 404 になる**（そして「なぜか真っ白なページ」で数時間溶かす）。

### 4. Mermaid 図はそのままでは描画されない

日次レポートには Mermaid 図（```mermaid のコードブロック）が入るが、Astro の標準 Markdown はこれをただのコードブロックとして出力する。**方針: ビルド時に SVG へ変換する**（クライアント側の JavaScript を持ち込まない）。理由は、JS を読み込む方式だと 1MB 近い mermaid.js がユーザーに届き、「モノクロ・ミニマル」の思想とも、JS なしでも読める静的サイトという性質とも合わないため。

### 5. タイムゾーン

GitHub Actions の実行環境は **UTC**。`SKILL.md` は「今日を JST で確定」と指示しているのでロジック上は正しいが、cron 式は UTC で書く必要がある（07:00 JST = 前日 22:00 UTC）。ワークフローに `TZ: Asia/Tokyo` を設定して二重に守る。

---

## SSG の選定（2026-07-13 決定）

**採用: [Astro](https://astro.build/)。** 当初案の mkdocs-material は破棄した。

**mkdocs-material を捨てた理由**: 「既定の見た目を消す」という方針を掲げていたが、これは「デザイン一式が売りのテーマを入れて、その売りを打ち消す CSS を書く」という状態で、テーマの恩恵がゼロになる。主役である独自タイムライン UI は Markdown 中に HTML を直書きして組むしかなく、多言語対応と podcast RSS もプラグインのこじつけになる。

**対抗馬だった [Hugo](https://gohugo.io/)**: Go の単一バイナリなので `node_modules` が不要、[多言語対応は組み込み](https://gohugo.io/content-management/multilingual/)、[カスタム出力フォーマット](https://gohugo.io/configuration/output-formats/)で podcast.xml も素直に出せる。**依存メンテのコストは Astro より明確に低い。**

**それでも Astro を選んだ理由**: このプロダクトの価値は独自タイムライン UI とタイポグラフィにあり、そこを Claude Code と何十回も作り直す。`.astro`（HTML に JSX 風の記法を足したもの）は Go テンプレートより反復が速く、LLM の生成精度も高い。**型安全のためではなく、設計と実装の反復速度のために選ぶ。**

**この決定は可逆**: Markdown-as-Database により、真のデータは `docs/` の markdown に全部ある。SSG は差し替え可能な薄い皮でしかない。`node_modules` の維持が苦痛になったら Hugo に移せばよい（posts はそのまま持ち込める）。**可逆な決定に時間をかけない**（[[feedback-simple-first]]）。

**依存を膨らませないための約束**:
- Astro のバージョンはピン留めし、依存更新は月 1 回にまとめる
- サイトのビルドと日次レポート生成は疎結合に保つ。Skill は markdown を書くだけで、Astro のことを一切知らない。**Astro が壊れてもレポートの蓄積は止まらない**

---

## AI の実行基盤（P3、2026-07-13 決定）

**採用: GitHub Actions + `CLAUDE_CODE_OAUTH_TOKEN`。** ローカルで `claude setup-token` を実行して発行したトークンを GitHub Secrets に置き、[claude-code-action](https://github.com/anthropics/claude-code-action) から `/daily-report` を cron 実行する。**API の従量課金ではなく、Claude のサブスク枠を消費する。**

**[Routines](https://code.claude.com/docs/en/routines)（`/schedule`）を採らなかった理由**: これも同じくサブスク枠で動くが、既定のネットワーク許可リスト（Trusted）がはてブ・Qiita・Zenn などを通さない。この Skill の本質は「30 個の任意ドメインを叩く」ことなので、許可リストを Full に開くはめになり、それは Routines の安全設計を無効化しているだけになる。

**トークンの扱い**: 有効期限があるためローテーションが必要。**失効すると毎朝の cron が黙って落ちる**ので、失敗通知は必ず設定する（TASK.md のバックログ項目）。

**使用量**: 1 日 1 回、約 30 ソースの取得と 25 トピックの執筆で、それなりの量のサブスク枠を消費する。Pro プランで枠が厳しければ、ソース数か件数を削る（[[feedback-simple-first]]）。
