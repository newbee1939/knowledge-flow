TODO: 作成途中
TODO: 完全に完成してから実装に入る


# Feed Lab — 最小プラン

インプット/アウトプット効率を最大化する個人ツール。
リポジトリ自体を DB・パイプライン・サイトにする、サーバレス構成。

## 全体像

```
GitHub Repo (work/feed-lab)
  ├─ ingest.yml  (毎朝 cron)   多ソース fetch → Claude採点 → digest.md commit
  ├─ publish.yml (毎時 cron)   share:true を拾って 日英ツイート → X 投稿
  └─ pages.yml   (push 毎)     mkdocs build → GitHub Pages 公開
```

## リポジトリ構成（最小）

```
work/feed-lab/
├── .github/workflows/{ingest,publish,pages}.yml
├── src/{ingest,summarize,publish}.py
├── feeds.yml          # 購読 RSS / 検索クエリのリスト
├── digests/YYYY/MM/DD.md   # データ本体
├── docs/ + mkdocs.yml
```

## データソース

`feeds.yml` に書いたものだけ取得。最初は RSS と Hacker News のみ。
あとから X / GitHub Trending / Reddit を追加可能。

## スコアリング

Claude API が記事ごとに `score (0.0-1.0)` + 1行サマリ + タグを返す。
上位 N 件を digest に採用。閾値で雑にノイズを切る。

## データモデル

各記事は Markdown ファイル。frontmatter に `score / share / posted` を持つ。
- `share: true` を自分で立てると、次の publish サイクルで X に投稿される
- 投稿後は `posted: true` と URL が書き戻される

## 公開

mkdocs-material + blog plugin + rss-plugin で静的サイト + RSS を生成。
GitHub Pages にデプロイ。メルマガ的に読める。

## ロードマップ

| Phase | 内容 |
|---|---|
| P1 | RSS のみ → digest → Pages 公開 |
| P2 | HN 追加、Claude 採点導入 |
| P3 | GitHub Trending / X / Reddit 追加 |
| P4 | share:true → X 日本語自動投稿 |
| P5 | 英語版投稿、Raycast 即時要約 |

P1 だけで「読めるメルマガサイト」が立つ。各フェーズ単体で使える。

## 設計原則

1. Markdown-as-Database（DB を持たない）
2. GitHub-as-Infra（Actions / Secrets / Pages / Repo で完結）
3. Score-Driven Filtering（数値スコアで絞る）

## やらないこと

DB / 常駐サーバ / n8n / 管理画面 / 認証 / 関心ドメインモデル
（必要になったら都度足す）

## シークレット（GitHub Actions secrets）

`ANTHROPIC_API_KEY`, `X_API_*`, `REDDIT_*`（追加時に登録）

## その他

- 英語・日本語の両方でアウトプット
- 様々な場所にアウトプット
- 日次・週次・月次
    - 今日は何があったか
    - 今週のトレンドは何か
    - 先月からどう変わったか
- はてブのChrome拡張で行ける。tsumikiは不要
    - あとで読む記事の要約とかは、TILで管理してもいいかも
    - それかはてブのチェックを定期予定にするとか

## 参考

- mkdocs-material: https://squidfunk.github.io/mkdocs-material/
- mkdocs blog plugin: https://squidfunk.github.io/mkdocs-material/setup/setting-up-a-blog/
- actions/deploy-pages: https://github.com/actions/deploy-pages
- HN Algolia API: https://hn.algolia.com/api
- X API v2 search: https://docs.x.com/x-api/posts/recent-search
