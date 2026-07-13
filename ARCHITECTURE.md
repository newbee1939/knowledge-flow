# Tech News Timeline

> **ステータス: 確定版。** 本ドキュメントは合意済みの設計仕様。方針を変える場合は本ファイルを改訂し、PR で履歴を残す。実装中の小さな揺らぎは TASK.md 側で吸収する。

「今日のテックを線で理解できる」一人運営のテックニュースメディア。日次レポートを **年→月→日のタイムライン** で横断表示する。

**実装方針: コンテンツ生成は Claude Code Skill で完結させる。** fetch・分類・要約・執筆はすべて Skill 内の自然言語指示で行う。人が書くコードは Astro のサイト部分（テンプレートと CSS）だけ。

**デザイン方針: モノクロ・ミニマル・洗練。** 白黒（＋極小のアクセント）、装飾を足さず **余白とタイポグラフィの精度** で勝負。年→月→日を横スクロールするタイムラインが主役。**既製テーマは使わず、Astro で HTML と CSS をゼロから書く**（テーマの既定を打ち消す CSS を書くくらいなら最初から書かない）。

---

## アーキテクチャ

```
毎朝（GitHub Actions / cron ※P3）
  └─ .claude/skills/daily-report/SKILL.md
       ├─ 情報ソースから記事取得 ─ WebFetch / curl
       ├─ AI / Infra / Backend / Frontend / Others に分類
       ├─ レポート本文を執筆（JP/EN を両方生成 ※P5）
       ├─ docs/blog/posts/YYYY-MM-DD.md (.en.md) を書く
       └─ git commit & push          ← index には触らない

月末 / 年末（GitHub Actions / cron ※P4）
  └─ monthly-summary / yearly-summary → docs/summaries/

配信（GitHub Actions / cron ※P6）
  └─ publish → X(JP/EN) 投稿 + Spotify 音声配信

GitHub Pages（push をトリガに Astro がビルド）
  └─ Content Collections が docs/ 配下の markdown を読む
       ├─ /                  … タイムライン（posts から導出、JP/EN 切替）
       ├─ /blog/YYYY-MM-DD/  … 日次レポート
       ├─ /summaries/...     … 月次・年次サマリ
       └─ /podcast.xml       … Spotify 用 RSS（Astro エンドポイント）
```

設計原則:
1. **Skill-as-Pipeline** — fetch/分類/執筆/配信は Claude Code Skill で完結
2. **Markdown-as-Database** — DB なし。`docs/` 配下の markdown がデータ
3. **Derived-not-Generated** — 一覧・タイムライン・RSS は posts から **ビルド時に導出** する。LLM に生成させない（出力が揺れて過去分が壊れるため）
4. **GitHub-as-Infra** — GitHub の Actions / Pages / Repo だけ
5. **Design-as-Product** — タイポグラフィと余白に妥協しない
6. **Add only when it hurts** — 抽象化・依存追加は痛みを感じてから

---

## ファイル構成

**`docs/` = データ（Skill が書く）／`src/` = サイトのコード（人と Claude が書く）** の 2 層に分ける。この境界を跨がせない。

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
│   ├── content.config.ts            # Content Collections（docs/ を glob で読む）
│   ├── pages/
│   │   ├── index.astro              # タイムライン（posts から導出）
│   │   └── podcast.xml.ts           # Spotify 用 RSS（P6）
│   ├── layouts/
│   └── styles/                      # モノクロ・ミニマルの CSS（自前）
├── astro.config.mjs
├── package.json
├── .github/workflows/
│   ├── pages.yml                    # Astro ビルド → Pages デプロイ（P2）
│   └── daily-report.yml             # cron で Skill 実行（P3）
├── ARCHITECTURE.md
└── README.md
```

`scripts/`、`apps/`、`pyproject.toml` は **作らない**。`package.json` は Astro のために作る（当初の「作らない」方針を撤回。理由は下記「SSG の選定」）。

---

## Skill の内容・情報ソース

**唯一の真実は `.claude/skills/daily-report/SKILL.md`。** 手順・執筆ルール・レポートのスキーマ・情報ソース一覧はすべてそちらに書く。本ドキュメントには転記しない（二重管理は必ずドリフトするため）。

各 Phase で追加する Skill も同様に `.claude/skills/<name>/SKILL.md` を唯一の真実とする。

---

## ロードマップ

| Phase | DoD |
|---|---|
| **P1 — Skill 化** | `/daily-report` の手動実行で `docs/blog/posts/<DATE>.md` が 1 件できる |
| **P2 — サイト化＋タイムライン UI** | Astro で GitHub Pages 公開。`/` が posts から導出された年→月→日の横スクロール・タイムライン。**デザインに妥協しない** |
| **P3 — 自動化** | GitHub Actions の cron で毎朝 `/daily-report` が走る |
| **P4 — 月次・年次サマリ** | `monthly-summary` / `yearly-summary` Skill を追加。月末・年末バッチ |
| **P5 — 多言語化（JP/EN）** | Astro 内蔵 i18n で UI 切替。`daily-report` は `.md` と `.en.md` の両方を生成 |
| **P6 — 配信先拡張** | `publish` Skill 追加 → X(JP/EN) 投稿 + Spotify 音声配信（TTS → `docs/audio/` + `/podcast.xml`、Spotify は RSS から自動取得） |

各 Phase は **既存 Phase に小さな差分** だけ。途中で「思ったより足りない」と感じたら戻ってこの表を更新する。

---

## SSG の選定（2026-07-13 決定）

**採用: [Astro](https://astro.build/)。** 当初案の mkdocs-material は破棄した。

**mkdocs-material を捨てた理由**: 「既定の見た目を消す」＝ テーマを入れて打ち消す CSS を書く構図で、テーマの恩恵がゼロ。主役の独自タイムライン UI は HTML-in-markdown で組むしかなく、i18n と podcast RSS もプラグインのこじつけになる。

**対抗馬だった [Hugo](https://gohugo.io/)**: 単一バイナリで `node_modules` が不要、[多言語対応は組み込み](https://gohugo.io/content-management/multilingual/)、[カスタム出力フォーマット](https://gohugo.io/configuration/output-formats/)で podcast.xml も素直に出せる。依存メンテのコストは Astro より明確に低い。

**それでも Astro を選んだ理由**: このプロダクトの価値は独自タイムライン UI とタイポグラフィにあり、そこを Claude Code と何度も作り直す。`.astro`（HTML + JSX 風）は Go テンプレートより反復が速く、LLM の生成精度も高い。**型安全のためではなく、設計と実装の反復速度のために選ぶ。**

**この決定は可逆**: Markdown-as-Database により真のデータは `docs/` の markdown に全部あり、SSG は差し替え可能な薄い皮でしかない。node_modules の維持が苦痛になったら Hugo に移す（posts はそのまま持ち込める）。悩む価値の低い決定に時間をかけない（[[feedback-simple-first]]）。

**依存を膨らませないための約束**:
- Astro のバージョンはピン留めし、依存更新は月 1 回にまとめる
- サイトのビルドと日次レポート生成は疎結合に保つ。Skill は markdown を書くだけで Astro を一切知らない。**Astro が壊れてもレポートの蓄積は止まらない**

---

## AI の実行基盤（P3、2026-07-13 決定）

**採用: GitHub Actions + `CLAUDE_CODE_OAUTH_TOKEN`。** `claude setup-token` で発行したトークンを GitHub Secrets に置き、[claude-code-action](https://github.com/anthropics/claude-code-action) から `/daily-report` を cron 実行する。**API 従量課金ではなく Claude のサブスク枠を消費する。**

**[Routines](https://code.claude.com/docs/en/routines)（`/schedule`）を採らなかった理由**: 同じくサブスク枠で動くが、既定のネットワーク許可リスト（Trusted）がはてブ・Qiita・Zenn 等を通さない。この Skill の本質は「30 個の任意ドメインを叩く」ことなので、許可リストを Full に開くことになり、Routines の安全設計を無効化するだけになる。

**トークンの扱い**: 有効期限があるためローテーションが必要。失効したら Actions が落ちるので、失敗通知を必ず設定する。
