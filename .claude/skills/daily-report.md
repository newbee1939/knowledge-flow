---
description: 1 日分のテックニュースをジャンル別にまとめ docs/blog/posts/<DATE>.md にコミットする日次レポート生成スキル
---

# 手順

1. **日付**: 今日を JST で `<DATE>`（`YYYY-MM-DD`）に確定。引数で日付を渡されたらそれを優先。
2. **取得**: `# 情報ソース` の各行の `[TAG]` に従う。`[RSS]`/`[Atom]`/`[HTML]` は WebFetch、`[API]`/`[JSON]` は `curl -s <URL>` + `jq`。取得できなければそのソースはスキップ。
3. **重複排除**: URL を正規化（`http`→`https`、`utm_*`/`fbclid`/`gclid` 除去、末尾スラッシュ除去）し、一致するものは 1 件に畳む。
4. **分類**: ai / frontend / backend / infra / others に分類（1 記事 1 ジャンル、迷ったら主題で判断）。各ジャンル上位 3 件まで。
5. **執筆**: 各ジャンル 300〜500 字。「リード文 1 文 → トピック 3 つ（要点＋インラインリンク）→ 示唆 1〜2 文」。引用 URL は本文中の Markdown リンクで埋める。
6. **書き出し**: `docs/blog/posts/<DATE>.md` に書く（同日再実行は上書き）。先頭に下記スキーマの frontmatter、本文は H2 で 5 ジャンル。空のジャンルはセクションごと省略。
7. **commit**: `git add docs/ && git commit -m "report: <DATE>"`。push は任意（手動確認のため）。

# レポートのスキーマ

frontmatter は 2 フィールドのみ（[[feedback-simple-first]]）:

```yaml
---
date: 2026-05-30
title: "一行ヘッドライン"
---
```

本文は H2 で `ai` / `frontend` / `backend` / `infra` / `others` を区切る。

執筆例（ai）:

```markdown
## ai

今日の AI 領域はエージェント実装の実務化が中心だった。

- [複数エージェントを協調させる実装パターン](https://example.com/a) が紹介された。
- [LLM 出力の自動評価を CI に組み込む試み](https://example.com/b) が議論された。
- [小型モデルのローカル運用コスト比較](https://example.com/c) が話題になった。

エージェントは「動かす」から「評価・運用」段階に移りつつある。
```

# 情報ソース

各行末尾の `[TAG]` が最適フォーマット: `[RSS]` / `[Atom]` / `[API]` / `[JSON]` / `[HTML]`。

## 日本 — テック
- はてブ テクノロジー `[RSS]`: https://b.hatena.ne.jp/hotentry/it.rss
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
- はてブ SRE 検索 `[RSS]`: https://b.hatena.ne.jp/q/sre?date_range=5y&sort=recent&target=all&users=3&mode=rss

## 日本 — その他
- はてブ 総合 `[RSS]`: https://b.hatena.ne.jp/hotentry/all.rss
- はてブ 暮らし `[RSS]`: https://b.hatena.ne.jp/hotentry/life.rss
- デイリーポータルZ `[RSS]`: https://dailyportalz.jp/feed/headline

## 海外
- Hacker News front page `[API]`: https://hn.algolia.com/api/v1/search?tags=front_page
- TechCrunch `[RSS]`: https://techcrunch.com/feed/
- Dev.to `[RSS]`: https://dev.to/feed/
- HACKERNOON `[RSS]`: https://hackernoon.com/feed
- Product Hunt `[RSS]`: https://www.producthunt.com/feed
- GCP Release Notes `[Atom]`: https://cloud.google.com/feeds/gcp-release-notes.xml
- Google Cloud (Medium) `[RSS]`: https://medium.com/feed/google-cloud
- SRE Weekly `[RSS]`: https://sreweekly.com/feed/

## セキュリティ
- IPA セキュリティアラート `[HTML]`: https://www.ipa.go.jp/security/security-alert/index.html

# 注意

- 既存 Skill（neta-trend-daily / url-digest）は触らない。
- 取得に失敗したソース・ジャンルは省略する（失敗履歴の記録・連続失敗判定は P3 で追加）。
- index.md（タイムライン）更新は P2、英訳は P5 で追加する。
