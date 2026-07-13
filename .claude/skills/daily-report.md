---
description: 1 日分のテックニュースをジャンル別にまとめ docs/blog/posts/<DATE>.md にコミットする日次レポート生成スキル
---

# 手順

1. **日付**: 今日を JST で `<DATE>`（`YYYY-MM-DD`）に確定。引数で日付を渡されたらそれを優先。
2. **取得**: `# 情報ソース` の各行の `[TAG]` に従う。`[RSS]`/`[Atom]`/`[HTML]` は WebFetch、`[API]`/`[JSON]` は `curl -s <URL>` + `jq`。取得できなければそのソースはスキップ。
3. **重複排除**: URL を正規化（`http`→`https`、`utm_*`/`fbclid`/`gclid` 除去、末尾スラッシュ除去）し、一致するものは 1 件に畳む。
4. **分類**: AI / Infra / Backend / Frontend / Others に分類（1 記事 1 ジャンル、迷ったら主題で判断）。各ジャンル上位 5 件まで。
5. **執筆**: 各ジャンルで、その日の重要ニュースを 5 件ピックアップし、1 件ずつしっかり要約する。各トピックは「見出し（記事タイトルをインラインリンクにした H3）＋ 要約 4〜6 文」。要約には〈何が起きたか・技術的な要点・なぜ重要か〉を含める。冗長な前置き・締めは書かない。
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

本文は H2 で `AI` / `Infra` / `Backend` / `Frontend` / `Others` を区切り、各ジャンル内に重要ニュース 5 件を H3 で並べる。

執筆例（AI、紙面の都合上 3 件のみ抜粋）:

```markdown
## AI

### [複数エージェントを協調させる実装パターン](https://example.com/a)

複数の LLM エージェントを役割分担させて 1 つのタスクを解く構成が紹介された。エージェント間で状態をどう共有し、片方の失敗をどう伝播・回復させるかが設計の肝で、単一エージェントより制御は複雑になる。記事では「プランナー／実行者／検証者」に分ける構成例を示し、検証者を挟むことで誤った出力の混入が減ったと報告。一方でエージェント数に比例してトークンコストとレイテンシが増えるため、タスクの難度に応じて使い分けるべきと結論づけている。

### [LLM 出力の自動評価を CI に組み込む試み](https://example.com/b)

LLM を使った機能の品質を、人手レビューに頼らず CI で自動チェックする取り組み。出力のブレをどう数値化し、どこに合格ラインを引くか（回帰検知の閾値化）が最大の論点として挙げられた。記事では正解例との類似度スコアと、別の LLM による採点を組み合わせる手法を紹介。完全な自動化は難しいものの、明らかな劣化を早期に検知する「ガードレール」としては有効だとしている。

### [小型モデルのローカル運用コスト比較](https://example.com/c)

クラウド API と、手元 GPU で動かす小型モデルのコスト・精度を実測比較した記事。リクエスト量が一定を超えるとローカル運用のほうが安くなる損益分岐点が示された。精度は大規模モデルに劣るが、要約や分類など定型タスクでは実用十分との評価。データを外部に出さずに済むプライバシー面の利点も、用途次第では決め手になると整理している。
```

# 情報ソース

各行末尾の `[TAG]` が最適フォーマット: `[RSS]` / `[Atom]` / `[API]` / `[JSON]` / `[HTML]`。

## 日本 — テック
- はてなブックマーク - 人気エントリー - テクノロジー `[RSS]`: https://b.hatena.ne.jp/hotentry/it.rss
- Publickey 新着記事 `[Atom]`: https://www.publickey1.jp/atom.xml
- Qiita 人気記事 `[RSS]`: https://qiita.com/popular-items/feed
- Zenn トレンド記事 `[RSS]`: https://zenn.dev/feed
- ITmedia 最新記事 `[RSS]`: https://rss.itmedia.co.jp/rss/2.0/topstory.xml
- @IT 最新記事 `[RSS]`: https://rss.itmedia.co.jp/rss/2.0/ait.xml
- Gigazine 最新記事 `[RSS]`: https://gigazine.net/news/rss_2.0/
- Gizmodo JP 新着記事 `[RSS]`: https://www.gizmodo.jp/feed/index.xml
- coliss 新着記事 `[RSS]`: https://coliss.com/feed/
- Findyメディア 新着記事 `[RSS]`: https://api.findy-code.io/rss/media/recent
- はてブ SRE 検索 `[RSS]`: https://b.hatena.ne.jp/q/sre?date_range=5y&sort=recent&target=all&users=3&mode=rss

## 日本 — その他
- はてなブックマーク - 人気エントリー - 総合 `[RSS]`: https://b.hatena.ne.jp/hotentry/all.rss
- はてなブックマーク - 人気エントリー - 暮らし `[RSS]`: https://b.hatena.ne.jp/hotentry/life.rss
- デイリーポータルZ 新着記事 `[RSS]`: https://dailyportalz.jp/feed/headline

## 海外
- Hacker News front page `[API]`: https://hn.algolia.com/api/v1/search?tags=front_page
- TechCrunch `[RSS]`: https://techcrunch.com/feed/
- Dev.to `[RSS]`: https://dev.to/feed/
- HackerNoon `[RSS]`: https://hackernoon.com/feed
- Product Hunt `[RSS]`: https://www.producthunt.com/feed
- Google Cloud Release Notes `[Atom]`: https://docs.cloud.google.com/feeds/gcp-release-notes.xml
- Google Cloud (Medium) `[RSS]`: https://medium.com/feed/google-cloud
- SRE Weekly `[RSS]`: https://sreweekly.com/feed/

## Reddit
取得方法は `# 注意` 参照（WebFetch 不可、curl で取る）。
- r/programming `[RSS]`: https://www.reddit.com/r/programming/.rss
- r/ExperiencedDevs `[RSS]`: https://www.reddit.com/r/ExperiencedDevs/.rss
- r/MachineLearning `[RSS]`: https://www.reddit.com/r/MachineLearning/.rss
- r/LocalLLaMA `[RSS]`: https://www.reddit.com/r/LocalLLaMA/.rss
- r/sre `[RSS]`: https://www.reddit.com/r/sre/.rss
- r/devops `[RSS]`: https://www.reddit.com/r/devops/.rss

## セキュリティ
- IPA セキュリティアラート `[HTML]`: https://www.ipa.go.jp/security/security-alert/index.html

# 注意

- 取得に失敗したソース・ジャンルは省略する。
- Reddit は WebFetch 不可（Claude Code がブロック）。`curl -s -H 'User-Agent: knowledge-flow/1.0' <URL>` で RSS を取得する。汎用 UA（`Mozilla/5.0` 等）や `.json` API は弾かれるので、固有 UA ＋ `.rss` を使う。レート制限で一時的に失敗することがあるが、その場合はスキップ。
