# Knowledge Flow — マスタープラン

> Status: Draft v0.4（実装着手前）
> Last updated: 2026-05-15

「今日のテックを線で理解できる」自分専用テックニュースメディア。

**実装方針: Claude Code Skill 1 本で完結させる。** コードを書くのは静的サイトの最小設定だけ。fetch・分類・要約・執筆はすべて Skill 内の自然言語指示で行う。

---

## アーキテクチャ

```
毎朝（scheduled agent）
  └─ Claude Code が .claude/skills/daily-report.md を実行
       ├─ ニュース取得（curl / WebFetch、既存スキル流用）
       ├─ FE / BE / Infra / AI / Others に分類 + 重要度が高い順に並べる
       ├─ レポート本文を執筆
       └─ reports/YYYY-MM-DD.md を git commit & push

GitHub Pages
  └─ mkdocs-material + blog plugin が reports/ をサイト化
       ├─ /              … 最新レポート
       └─ /YYYY-MM-DD/   … 過去レポート
```

設計原則:
1. **Skill-as-Pipeline** — fetch/分類/執筆は Claude Code Skill で完結。アプリコードは書かない
2. **Markdown-as-Database** — DB なし。reports/ そのものがデータ
3. **GitHub-as-Infra** — Actions / Pages / Repo だけ
4. **Add only when it hurts** — 抽象化・依存追加は痛みを感じてから

---

## ファイル構成

```
knowledge-flow/
├── .claude/skills/daily-report.md   # Skill 本体（ロジックは全部ここ）
├── reports/YYYY-MM-DD.md            # Claude が書く 1 日 1 ファイル
├── docs/                            # mkdocs ソース（index は reports へのリンク集）
├── mkdocs.yml
├── .github/workflows/pages.yml      # mkdocs build → Pages deploy
├── PLAN.md                          # 本ファイル
└── README.md                        # 公開時に作る
```

これだけ。`src/`、`scripts/`、`apps/`、`package.json`、`pyproject.toml`、いずれも **作らない**。

---

## daily-report.md（Skill の骨組み）

```markdown
---
description: 1 日分のテックニュースをジャンル別にまとめ reports/ にコミット
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
6. frontmatter（後述のスキーマ）を付けて `reports/<DATE>.md` に書く
7. `git add reports/<DATE>.md && git commit -m "report: <DATE>" && git push`

# レポートのスキーマ

\`\`\`yaml
date: 2026-05-15
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
| **P1 — 手動で動かす** | Skill を書いて手動実行、reports/ にコミットされる。1 件できれば可 |
| **P2 — サイト化** | mkdocs-material + blog plugin で Pages に出る。RSS フィードも出す |
| **P3 — 自動化** | scheduled remote agent（or GitHub Actions + Claude Code CLI）で毎朝走る |
| **P4 — X 投稿** | `share: true` を立てたレポートを X(JP) に投稿する別 Skill `publish-tweet.md` を追加 |
| **P5 — 線で見るビュー** | 過去レポートを日付×ジャンルのグリッドで横断表示するページを `docs/` に追加 |
| **P6 — 英語版** | 英語レポート出力＋ X(EN) 投稿。`report.md` プロンプトを多言語化 |

各 Phase は **既存 Phase に小さな差分** だけ。途中で「思ったより足りない」と感じたら戻ってこの表を更新する。
