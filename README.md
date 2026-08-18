# knowledge-flow

今日のテックを線で理解できる、一人運営のテックニュースメディア。日次レポートを年→月→日のタイムラインで横断表示する。

- 公開サイト: https://newbee1939.github.io/knowledge-flow/
- [設計・ロードマップ → ARCHITECTURE.md](./ARCHITECTURE.md)
- [タスク一覧 → TASK.md](./TASK.md)

## 開発

```sh
npm ci
npm run dev
```

- `npm run lint` — Biome によるフォーマット・静的解析
- `npm run test` — Vitest
- `npm run build` — Astro ビルド
- `npm run articles` — 過去レポートの記事索引を TSV で出力（日次レポート生成 Skill が過去の言及を引くのに使う）

## コードの構成

markdown と JSON が入口で HTML が出口。その間を一方向に流れる。

```
docs/blog/posts/*.md      データ層。Skill だけが書く
docs/blog/periods/*.md    月・年のまとめ記事（ファイル名が期間キー: 2026-08.md / 2026.md）
        ↓
src/content.config.ts     Content Collections の定義と frontmatter のスキーマ
        ↓
src/lib/posts.ts          astro:content を触る唯一の場所。壊れていたらビルドを止める
        ↓                 （以降はただの配列・オブジェクト。Astro は登場しない）
src/lib/*.ts              純粋関数。抽出・集約・整形
        ↓                 ※ summaries.ts だけは docs/blog/summaries.json を直接 import する
src/components/*.astro    2 ページ以上で使う見た目の部品
        ↓
src/pages/*.astro         受け取ったデータを HTML にする
```

守っているのは 3 つだけ。

1. **Astro を知っているのは `posts.ts` だけ。** 依存の向きを「I/O → 純粋関数」の一方向に固定する。おかげでモックが要るテストは `posts.test.ts` だけで、他は引数を渡すだけで書ける
2. **壊れたデータはビルドで落とす。** posts が 0 件・ファイル名と frontmatter の `date` の食い違い・記事 URL の重複は、いずれも `getPosts()` / `getArticles()` が例外を投げる。毎朝自動更新される以上、壊れたサイトが静かに公開されるほうが怖い
3. **`.astro` にロジックを置かない。** 分岐や集約は `src/lib/` に出し、隣に `*.test.ts` を書く

| `src/lib/` | 役割 |
|---|---|
| `posts.ts` | コレクション（レポート・まとめ記事）の取得と検証。**唯一の I/O 境界** |
| `articles.ts` | 日次レポート本文から記事（H3 見出し 1 つ）を抽出 |
| `categories.ts` | 記事をカテゴリ別に集約 |
| `related.ts` | 記事ごとに、カテゴリを共有する過去の記事を引く（レポート末尾の「この日の話題の続き」） |
| `timeline.ts` | `date` を持つ列を年 → 月に集約（トップとカテゴリページで共用） |
| `periods.ts` | 期間キー（`2026-08` / `2026`）の組み立てと表示名 |
| `summaries.ts` | 月・年のひとことタイトル（サイト全体／カテゴリ別）を `docs/blog/summaries.json` から引く |
| `date.ts` | 表示用の `YYYY-MM-DD`（UTC）整形 |
| `url.ts` | `base` 込みのサイト内リンク組み立て |
| `rehypeLinks.ts` | 本文の外部リンクに `target` / `rel` を付与し、サイト内リンク（`/blog/...`）に `base` を前置（`astro.config.mjs` から使う） |

| `src/components/` | 役割 |
|---|---|
| `Timeline.astro` | 年 → 月 → 日カード（横スクロール）の年表。ひとことタイトルとまとめ記事へのリンクの解決もここで畳む |
| `Prose.astro` | Markdown 本文の体裁（日次レポートとまとめ記事で共用） |

**部品を切り出すのは 2 ページ目で同じものが要るとき。** 1 ページでしか使わないマークアップは `.astro` に置いたままにする。`Timeline.astro` はトップとカテゴリページで同じ年表を出す必要が生まれて切り出した（渡す props が違うだけ）。

### ページとコンポーネントの境界

- **ページは「何を載せるか」を決める。** `getPosts()` / `getPeriods()` を呼ぶのはページだけ。集めたデータを props で渡す
- **コンポーネントは「どう見せるか」を決める。** props と `src/lib/` の純粋関数だけで組み立て、I/O はしない
  - 例: 「まとめ記事がある期間はどれか」はページが渡す事実。「その期間をどの URL へリンクするか」は `Timeline.astro` が組む。URL の形をページに知らせないので、`/periods/` の構造を変えても直すのは 1 か所
- **分けるかどうかの目安。** props のフラグが増えて中が分岐だらけになる、片方のページでしか描かない枝が生える — このどちらかが出たらコンポーネントを分ける。それまでは 1 つで持つ（分割の最大のコストは CSS の重複）

## 自動化

サイトのコンテンツは Claude Code Skill が書き、GitHub Actions が実行する。`src/` は人が書き、`docs/` は Skill だけが書く。

| Skill | 実行 | 書き込み先 |
|---|---|---|
| `/daily-report` | `daily-report.yml`（毎日 cron） | `docs/blog/posts/<DATE>.md` |
| `/period-summary` | `period-summary.yml`（月初 cron） | `docs/blog/periods/<期間>.md`、`docs/blog/summaries.json` |
| `/proofread` | 手動 | `docs/blog/posts/*.md` の誤字修正 |

手順・執筆ルールは各 `.claude/skills/<name>/SKILL.md` が唯一の真実。README には転記しない。

設計の背景・方針は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照。
