---
description: 1 日分のテックニュースをジャンル別にまとめ docs/blog/posts/<DATE>.md にコミットする日次レポート生成スキル
---

# 手順

上から順に実行する。途中で取得に失敗したソース・ジャンルがあっても止めず、`# 注意` のフォールバック方針に従う。

## 1. 日付確定

- 今日の日付を **JST** で確定し `<DATE>`（`YYYY-MM-DD`）とする。
- 引数で日付を渡された場合はそれを優先する（再生成・過去日埋め用）。

## 2. 取得

`## 情報ソース` の各行末尾 `[TAG]` に従って取得する。

| TAG | 取得方法 |
|---|---|
| `[RSS]` / `[Atom]` | **WebFetch** でフィードをそのまま取得し、各 item の title / link / 日付を読む |
| `[API]` | **`curl -s <URL>`** で JSON を取得し `jq` で必要フィールドを抽出（例: HN は `.hits[] | {title, url, points}`） |
| `[JSON]` | **`curl -s <URL>`** で取得し `jq` で抽出（Reddit は `.data.children[].data | {title, url, ups}`） |
| `[HTML]` | **WebFetch** で取得し、本文（更新日・見出し・リンク）を抽出 |

**curl の注意**: Reddit など UA を要求するソースは `curl -s -H 'User-Agent: knowledge-flow/1.0' <URL>` を使う。

**フォールバック順**（指定フォーマットで失敗したとき）:

```
指定フォーマット失敗 → 同 URL の末尾を .rss に変えて試す
                    → .json に変えて試す
                    → 最終手段として HTML をパース
```

すべて失敗したソースは今回スキップし、`# 注意` の連続失敗ルールに従う。

## 3. 重複排除

同一記事が複数ソースに現れることがある。**URL を正規化してから**重複判定する。

正規化ルール（最低限）:
- スキームを `http` → `https` に統一
- クエリパラメータのうち `utm_*` / `fbclid` / `gclid` を**除去**（その他のトラッキング系も同様に落としてよい）
- 末尾スラッシュを統一（パス末尾の `/` を削除）
- ホスト名は小文字化

正規化後 URL が一致するものは **1 件に畳む**（情報量の多い方のタイトル・出典を採用）。

## 4. 分類（5 ジャンル）

各記事を以下の 5 ジャンルのいずれか 1 つに分類する。各ジャンル **上位 3 件まで**（注目度・新規性で選ぶ）。

| ジャンル | 判定基準（キーワード例） | 境界事例の扱い |
|---|---|---|
| **ai** | LLM / 生成 AI / 機械学習 / Claude / GPT / Gemini / 画像生成 / RAG / エージェント | 「AI 搭載の Web フレームワーク」→ 主題が AI なら ai、UI 実装なら frontend |
| **frontend** | React / Vue / CSS / TypeScript（UI 文脈）/ ブラウザ / Web デザイン / アクセシビリティ | 「React の状態管理ライブラリ」→ frontend。SSR の話でも UI 主体なら frontend |
| **backend** | API / DB / 言語処理系 / フレームワーク（サーバ）/ 認証 / 分散システム | 「サーバ言語の新機能」→ backend。DB 運用が主題なら infra 寄りで判断 |
| **infra** | クラウド / Kubernetes / CI/CD / SRE / 監視 / ネットワーク / セキュリティ運用 | 「GCP リリースノート」→ infra。セキュリティ脆弱性情報も基本 infra |
| **others** | 上記いずれにも当てはまらないテック・ガジェット・キャリア・暮らし | 判定に迷い、かつ技術主題が薄いものはここ |

**一意性の原則**: 1 記事 = 1 ジャンル。複数該当する場合は「**記事の主題（何が一番の論点か）**」で決める。手段として技術が出てくるだけなら、その技術のジャンルには入れない。

## 5. 執筆

各ジャンルを **300〜500 字** で書く。構造は固定:

```
リード文 1 文（そのジャンルの今日の総括）
- トピック1（記事の要点 + [インラインリンク](URL)）
- トピック2（同上）
- トピック3（同上）
示唆 1〜2 文（読者にとっての意味・流れの読み）
```

- 引用 URL は**本文中にインライン Markdown リンク**で埋め込む（脚注や末尾リンク集にしない）。
- 見本（ai ジャンル）:

```markdown
## ai

今日の AI 領域は、エージェント実装の実務化と評価手法の議論が中心だった。

- [LangGraph で複数エージェントを協調させる実装パターン](https://example.com/a) が紹介され、状態共有の設計が要点として挙がった。
- [LLM 出力の自動評価を CI に組み込む試み](https://example.com/b) では、回帰検知をどう閾値化するかが論点になった。
- [小型モデルのローカル運用コスト比較](https://example.com/c) が話題で、推論コストと精度のトレードオフが整理された。

エージェントは「動かす」から「評価・運用する」段階に移りつつある。明日以降は評価基盤の標準化に注目したい。
```

## 6. 書き出し

- 出力先は **`docs/blog/posts/<DATE>.md`** に固定（`<DATE>` は `YYYY-MM-DD`）。
- 同じ日に 2 回実行したら**上書き**する（追記しない）。
- ファイル先頭に `# レポートのスキーマ` の frontmatter、続けて H2 で 5 ジャンルを並べる。
- 取得失敗で空になったジャンルは**セクションごと省略**する（空 H2 を残さない）。

## 7. docs/index.md 更新（P2 で実装）

タイムライン UI への差し込みは **P2 で具体化**する。P1 ではこの手順は実行しない。

## 8. commit

```sh
git add docs/
git commit -m "report: <DATE>"
```

- コミットメッセージは **`report: <DATE>`** 固定（`<DATE>` は `YYYY-MM-DD`）。
- `git add` は **`docs/` に範囲を絞る**（Skill 本体や設定ファイルを巻き込まない）。
- **`git push` は P1 では任意**（手動で内容確認したいため、push しないでコミットまでで止めてよい）。

---

# レポートのスキーマ

frontmatter は **2 フィールドのみ**（[[feedback-simple-first]]）:

```yaml
---
date: 2026-05-29        # ISO 8601 (YYYY-MM-DD)
title: "一行ヘッドライン"   # その日を一言で表す見出し
---
```

`weight` / `share` / `editor_note` 等は**書かない**。必要になってから追加する。

本文は H2 で 5 ジャンル（`ai` / `frontend` / `backend` / `infra` / `others`）を区切る。

---

# 情報ソース

各エントリ末尾の `[TAG]` が **最適フォーマット**: `[RSS]` / `[Atom]` / `[API]`（専用 JSON API） / `[JSON]`（末尾 `.json`） / `[HTML]`。
取得方法とフォールバックは `## 2. 取得` を参照。

## 日本 — テック
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

## Reddit
- r/programming `[JSON]`: https://www.reddit.com/r/programming/hot/.json
- r/sre `[JSON]`: https://www.reddit.com/r/sre/hot/.json
- r/LocalLLaMA, r/ClaudeCode, r/webdev, r/netsec `[JSON]`（任意）

## セキュリティ
- IPA セキュリティアラート `[HTML]`: https://www.ipa.go.jp/security/security-alert/index.html

---

# 注意

- 既存 Skill（neta-trend-daily / url-digest）は触らない。
- 取得に失敗したジャンルは**セクションごと省略**する。
- あるソースが **3 日連続で失敗**したら、勝手に削除せず `## 情報ソース` の該当行末尾に `<!-- 除外候補: <理由> -->` を追記し、人間レビューに回す（P3 で運用）。
