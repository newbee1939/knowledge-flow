# Tech News Timeline

「今日のテックを線で理解できる」一人運営のテックニュースメディア。日次レポートを **年→月→日のタイムライン** で横断表示する。

**実装方針: Claude Code Skill で完結させる。** コードを書くのは静的サイトの最小設定だけ。fetch・分類・要約・執筆はすべて Skill 内の自然言語指示で行う。

**デザイン方針: モノクロ・ミニマル・洗練。** 黒白（＋極小のアクセント）、装飾を足さず **余白とタイポグラフィの精度** で勝負。年→月→日を横スクロールするタイムラインが主役。mkdocs-material 既定の見た目は**消す**（カスタム CSS で上書き）。

---

## アーキテクチャ

```
毎朝（scheduled agent）
  └─ .claude/skills/daily-report.md
       ├─ 情報ソース（下記）から記事取得 ─ WebFetch / curl
       ├─ AI / Frontend / Backend / Infra / Others に分類
       ├─ レポート本文を執筆（JP / EN を両方生成 ※P5）
       ├─ docs/blog/posts/YYYY-MM-DD.md (.en.md) を書く
       ├─ docs/index.md（タイムライン UI）を再生成
       └─ git commit & push

月末 / 年末（scheduled agent）
  └─ monthly-summary.md / yearly-summary.md → docs/summaries/

配信（scheduled agent ※P6）
  └─ publish.md → X(JP/EN) 投稿 + Spotify 音声配信

GitHub Pages
  └─ mkdocs-material がビルド
       ├─ /                  … タイムライン（独自 UI、JP/EN 切替）
       ├─ /blog/YYYY-MM-DD/  … 日次レポート
       ├─ /summaries/...     … 月次・年次サマリ
       └─ /podcast.xml       … Spotify 用 RSS
```

設計原則:
1. **Skill-as-Pipeline** — fetch/分類/執筆/配信は Claude Code Skill で完結。アプリコードは書かない
2. **Markdown-as-Database** — DB なし。`docs/` 配下の markdown がデータ
3. **GitHub-as-Infra** — GitHub の Actions / Pages / Repo だけ
4. **Design-as-Product** — タイポグラフィと余白に妥協しない
5. **Add only when it hurts** — 抽象化・依存追加は痛みを感じてから

---

## ファイル構成

```
knowledge-flow/
├── .claude/skills/
│   ├── daily-report.md              # 日次（メイン）
│   ├── monthly-summary.md           # 月末バッチ（P4）
│   ├── yearly-summary.md            # 年末バッチ（P4）
│   └── publish.md                   # X / Spotify 配信（P6）
├── docs/
│   ├── index.md                     # タイムライン UI（daily-report が再生成）
│   ├── stylesheets/extra.css        # カスタム CSS（P2）
│   ├── blog/posts/YYYY-MM-DD[.en].md
│   ├── summaries/YYYY[-MM][.en].md  # P4
│   ├── audio/YYYY-MM-DD.mp3         # TTS 音声（P6）
│   └── podcast.xml                  # Spotify 用 RSS（P6）
├── mkdocs.yml
├── .github/workflows/pages.yml
├── ARCHITECTURE.md
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

1. 今日の日付を JST で確定 → <DATE>
2. 「## 情報ソース」から取得（各行の `[TAG]` に従う。`[RSS]`/`[Atom]`=WebFetch、`[API]`/`[JSON]`=curl+jq、`[HTML]`=WebFetch+パース。フォールバックは同節参照）
3. 重複排除（URL の utm パラメータ等を正規化）
4. 5 ジャンル（ai / frontend / backend / infra / others）に分類、各ジャンル上位 3 件
5. 各ジャンル 300〜500 字（リード文 + 3 トピック + 示唆、引用 URL は本文リンク）
6. frontmatter + 本文を docs/blog/posts/<DATE>.md に書く
7. docs/index.md の今日の枠を更新
8. git add docs/ && git commit -m "report: <DATE>" && git push

# レポートのスキーマ

\`\`\`yaml
date: 2026-05-16
title: "一行ヘッドライン"
\`\`\`

本文は H2 で 5 ジャンル（ai / frontend / backend / infra / others）を区切る。
`weight` / `share` / `editor_note` 等は必要になってから（[[feedback-simple-first]]）。

# 注意
- 既存 Skill (neta-trend-daily / url-digest) は触らない
- 取得に失敗したジャンルは本文ごと省略
```

---

## 情報ソース

各エントリ末尾の `[TAG]` が **最適フォーマット**: `[RSS]` / `[Atom]` / `[API]`（専用 JSON API） / `[JSON]`（末尾 `.json`） / `[HTML]`。

**フォールバック方針**: 指定フォーマットで失敗 → 末尾 `.rss` を試す → `.json` を試す → 最終手段は HTML パース。3 日連続失敗で除外候補。

### 日本 — テック
- はてブ テクノロジー `[RSS]`: https://b.hatena.ne.jp/hotentry/it.rss
- はてブ IT/AI・機械学習 `[RSS]`: https://b.hatena.ne.jp/hotentry/it/AI%E3%83%BB%E6%A9%9F%E6%A2%B0%E5%AD%A6%E7%BF%92.rss
- はてブ IT/セキュリティ技術 `[RSS]`: https://b.hatena.ne.jp/hotentry/it/%E3%82%BB%E3%82%AD%E3%83%A5%E3%83%AA%E3%83%86%E3%82%A3%E6%8A%80%E8%A1%93.rss
- Publickey `[Atom]`: https://www.publickey1.jp/atom.xml
- Qiita 人気 `[RSS]`: https://qiita.com/popular-items/feed
- Zenn `[RSS]`: https://zenn.dev/feed
- ITmedia `[RSS]`: https://rss.itmedia.co.jp/rss/2.0/topstory.xml
- @IT `[RSS]`: https://rss.itmedia.co.jp/rss/2.0/ait.xml
- Gigazine `[RSS]`: https://gigazine.net/news/rss_2.0/
- GIZMODO JP `[RSS]`: https://www.gizmodo.jp/index.xml
- coliss `[RSS]`: https://coliss.com/feed/
- Workship `[RSS]`: https://goworkship.com/magazine/feed/
- Findy `[RSS]`: https://api.findy-code.io/rss/media/recent
- LevTech `[RSS]`: https://levtech.jp/media/feed/
- note magazine `[RSS]`: https://note.com/notemagazine/m/mf2e92ffd6658/rss
- はてブ SRE 検索 `[RSS]`: https://b.hatena.ne.jp/q/sre?date_range=5y&sort=recent&target=all&users=3&mode=rss

### 日本 — その他
- はてブ 総合 `[RSS]`: https://b.hatena.ne.jp/hotentry/all.rss
- はてブ 暮らし `[RSS]`: https://b.hatena.ne.jp/hotentry/life.rss
- デイリーポータルZ `[RSS]`: https://dailyportalz.jp/feed/headline

### 海外
- Hacker News front page `[API]`: https://hn.algolia.com/api/v1/search?tags=front_page
- TechCrunch `[RSS]`: https://techcrunch.com/feed/
- Dev.to `[RSS]`: https://dev.to/feed/
- HACKERNOON `[RSS]`: https://hackernoon.com/feed
- Product Hunt `[RSS]`: https://www.producthunt.com/feed
- GCP Release Notes `[Atom]`: https://cloud.google.com/feeds/gcp-release-notes.xml
- Google Cloud (Medium) `[RSS]`: https://medium.com/feed/google-cloud
- SRE Weekly `[RSS]`: https://sreweekly.com/feed/

### Reddit
- r/programming `[JSON]`: https://www.reddit.com/r/programming/hot/.json
- r/sre `[JSON]`: https://www.reddit.com/r/sre/hot/.json
- r/LocalLLaMA, r/ClaudeCode, r/webdev, r/netsec `[JSON]`（任意）

### セキュリティ
- IPA セキュリティアラート `[HTML]`: https://www.ipa.go.jp/security/security-alert/index.html

---

## ロードマップ

| Phase | DoD |
|---|---|
| **P1 — Skill 化** | `daily-report.md` 手動実行で `docs/blog/posts/<DATE>.md` が 1 件できる |
| **P2 — サイト化＋タイムライン UI** | mkdocs-material で Pages 公開。`docs/index.md` が年→月→日の横スクロール・タイムライン。**デザインに妥協しない** |
| **P3 — 自動化** | scheduled agent で毎朝 `daily-report` が走る |
| **P4 — 月次・年次サマリ** | `monthly-summary.md` / `yearly-summary.md` を追加。月末・年末バッチ |
| **P5 — 多言語化（JP/EN）** | mkdocs-static-i18n で UI 切替。`daily-report` は `.md` と `.en.md` の両方を生成 |
| **P6 — 配信先拡張** | `publish.md` 追加 → X(JP/EN) 投稿 + Spotify 音声配信（TTS → `docs/audio/` + `docs/podcast.xml`、Spotify は RSS から自動取得） |

各 Phase は **既存 Phase に小さな差分** だけ。途中で「思ったより足りない」と感じたら戻ってこの表を更新する。
