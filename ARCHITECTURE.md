# Tech News Timeline

「今日のテックを線で理解できる」自分専用テックニュースメディア。日次レポートを **年→月→日のタイムライン** で横断表示する。

**実装方針: Claude Code Skill で完結させる。** コードを書くのは静的サイトの最小設定だけ。fetch・分類・要約・執筆はすべて Skill 内の自然言語指示で行う。

**デザイン方針: モノクロ・ミニマル・洗練。** 黒白（＋極小のアクセント）、装飾を足さず **余白とタイポグラフィの精度** で勝負。年→月→日を横スクロールするタイムラインが主役。mkdocs-material 既定のドキュメントサイト感は**消す**（カスタム CSS で上書き）。「個人のメモサイト」に見えたら負け。

---

## アーキテクチャ

```
毎朝（scheduled agent）
  └─ Claude Code が .claude/skills/daily-report.md を実行
       ├─ ニュース取得（curl / WebFetch、既存スキル流用）
       ├─ AI / Frontend / Backend / Infra / Others に分類 + 重要度順
       ├─ レポート本文を執筆
       ├─ docs/blog/posts/YYYY-MM-DD.md を書く
       ├─ docs/index.md（タイムライン UI）を再生成
       └─ git commit & push

月末（scheduled agent）
  └─ monthly-summary.md → docs/summaries/YYYY-MM.md

年末（scheduled agent）
  └─ yearly-summary.md → docs/summaries/YYYY.md

GitHub Pages
  └─ mkdocs-material がビルド
       ├─ /                  … タイムライン（独自 UI）
       ├─ /blog/YYYY-MM-DD/  … 日次レポート（blog plugin）
       └─ /summaries/...     … 月次・年次サマリ
```

設計原則:
1. **Skill-as-Pipeline** — fetch/分類/執筆は Claude Code Skill で完結。アプリコードは書かない
2. **Markdown-as-Database** — DB なし。`docs/` 配下の markdown そのものがデータ
3. **GitHub-as-Infra** — GitHub の Actions / Pages / Repo だけ
4. **Design-as-Product** — 「個人のメモサイト」に見えたら負け。タイポグラフィと余白に妥協しない
5. **Add only when it hurts** — 抽象化・依存追加は痛みを感じてから

---

## ファイル構成

```
knowledge-flow/
├── .claude/skills/
│   ├── daily-report.md              # 日次 Skill（メイン）
│   ├── monthly-summary.md           # 月末バッチ（P4）
│   └── yearly-summary.md            # 年末バッチ（P4）
├── docs/
│   ├── index.md                     # タイムライン UI（daily-report が再生成）
│   ├── stylesheets/extra.css        # カスタム CSS（P2）
│   ├── blog/
│   │   ├── index.md
│   │   └── posts/YYYY-MM-DD.md      # 日次レポート
│   └── summaries/
│       ├── YYYY-MM.md               # 月次サマリ（P4）
│       └── YYYY.md                  # 年次サマリ（P4）
├── mkdocs.yml
├── .github/workflows/pages.yml      # mkdocs build → Pages deploy
├── ARCHITECTURE.md                  # 本ファイル
└── README.md
```

`src/`、`scripts/`、`apps/`、`package.json`、`pyproject.toml`、いずれも **作らない**。

---

## daily-report.md（Skill の骨組み）

```markdown
---
description: 1 日分のテックニュースをジャンル別にまとめ docs/blog/posts/ にコミット
---

# 手順

1. 今日の日付を JST で確定 → `<DATE>` とする
2. 以下のソースから記事を集める
   - はてなブックマーク IT
   - Hacker News
   - Reddit（r/LocalLLaMA, r/ClaudeCode, r/programming, r/webdev, r/netsec）
   - 主要 RSS: Anthropic, Astro, AWS What's New, ...
3. 重複排除（記事 URL の utm パラメータ等を正規化）
4. 5 ジャンル（ai / frontend / backend / infra / others）に分類し、各ジャンル上位 3 件を選ぶ
5. 各ジャンルにつき 300〜500 字のレポートを執筆
   - リード文 + 主要 3 トピック + 読者にとっての示唆
   - 引用 URL は markdown リンクで本文に埋める
6. frontmatter（後述のスキーマ）を付けて `docs/blog/posts/<DATE>.md` に書く
7. `docs/index.md`（タイムライン UI）の今日の枠を更新
8. `git add docs/ && git commit -m "report: <DATE>" && git push`

# レポートのスキーマ

\`\`\`yaml
date: 2026-05-16
title: "一行ヘッドライン"
\`\`\`

本文は markdown の H2 で 5 ジャンル（ai / frontend / backend / infra / others）を区切る。
`weight` / `share` / `editor_note` 等は必要になってから追加する（[[feedback-simple-first]]）。

# 注意

- 既存 Skill (neta-trend-daily / url-digest) は触らない
- 取得に失敗したジャンルは本文ごと省略
```

---

## ロードマップ

| Phase | DoD（これが出来たら次へ） |
|---|---|
| **P1 — Skill 化** | `daily-report.md` を書いて手動実行、`docs/blog/posts/<DATE>.md` が 1 件できる |
| **P2 — サイト化＋タイムライン UI** | mkdocs-material で Pages 公開。`docs/index.md` が年→月→日の横スクロール・タイムライン。**デザインに妥協しない**（カスタム CSS / 独自タイポグラフィ） |
| **P3 — 自動化** | scheduled agent で毎朝 `daily-report` が走る |
| **P4 — 月次・年次サマリ** | `monthly-summary.md` / `yearly-summary.md` を追加。月末・年末バッチで生成し、タイムラインの月/年ラベルに反映 |
| **P5 — X 投稿** | レポートを X(JP) に投稿する別 Skill `publish-tweet.md` を追加 |
| **P6 — 英語版** | 英語レポート出力＋ X(EN) 投稿。プロンプトを多言語化 |

各 Phase は **既存 Phase に小さな差分** だけ。途中で「思ったより足りない」と感じたら戻ってこの表を更新する。
