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
- `npm run build` — 型チェック（`astro check`）→ Astro ビルド。**型エラーがあればビルドしない**
  - Biome も Vitest も型は見ない（どちらも内部で型注釈を捨てるだけ）。型を実際に検査するのは `astro check` だけで、`.astro` の型も含めて見られるのはこれしかない（[公式の推奨](https://docs.astro.build/en/guides/typescript/)）
- `npm run articles` — 全記事の索引を TSV で出力（daily-report skill が関連する過去記事を探すために使う。サイトのビルドには関与しない）

## コードの構成

markdown と JSON が入口で HTML が出口。その間を一方向に流れる。

```
docs/blog/posts/*.md      データ層。Skill だけが書く
docs/blog/periods/*.md    月・年のまとめ記事（ファイル名が期間キー: 2026-08.md / 2026.md）
docs/tips/*.md            手書きの解説記事（ファイル名が slug: openrouter.md）。人だけが書く
        ↓
src/content.config.ts     Content Collections の定義と frontmatter のスキーマ
        ↓
src/lib/posts.ts          astro:content を触る唯一の場所。壊れていたらビルドを止める
        ↓                 （以降はただの配列・オブジェクト。Astro は登場しない）
src/lib/*.ts              純粋関数。抽出・集約・整形
        ↓                 ※ summaries.ts だけは docs/blog/summaries.json を直接 import し、自前で検証する
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
| `posts.ts` | コレクション（レポート・まとめ記事・Tips）の取得と検証。**唯一の I/O 境界** |
| `articles.ts` | 日次レポート本文から記事（H3 見出し 1 つ）を抽出 |
| `categories.ts` | 記事をカテゴリ別に集約 |
| `tips.ts` | 記事本文から Tips への壊れたリンクを検出（存在しない slug はビルドを止める） |
| `timeline.ts` | `date` を持つ列を年 → 月に集約（トップとカテゴリページで共用） |
| `periods.ts` | 期間キー（`2026-08` / `2026`）の組み立てと表示名 |
| `summaries.ts` | 月・年のひとことタイトル（サイト全体／カテゴリ別）を `docs/blog/summaries.json` から引く。Content Collections を通らないぶん、形の検証も自前で行う |
| `date.ts` | 表示用の `YYYY-MM-DD`（UTC）整形 |
| `url.ts` | `base` 込みのサイト内リンク組み立て |
| `rehypeExternalLinks.ts` | 本文の外部リンクに `target` / `rel` を付与（`astro.config.mjs` から使う） |

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

サイトのコンテンツは Claude Code Skill が書き、GitHub Actions が実行する。`src/` は人が書き、`docs/blog/` は Skill だけが書く（`docs/tips/` だけは例外で人が書く。次節）。

| Skill | 実行 | 書き込み先 |
|---|---|---|
| `/daily-report` | `daily-report.yml`（毎日 cron） | `docs/blog/posts/<DATE>.md` |
| `/period-summary` | `period-summary.yml`（月初 cron） | `docs/blog/periods/<期間>.md`、`docs/blog/summaries.json` |
| `/proofread` | 手動 | `docs/blog/posts/*.md` の誤字修正 |

**Skill が作ったコミットの push は、Skill 自身ではなくワークフローが行う。** push の直前に「許可された場所の外が変わっていないか」を検査し、変わっていたら push せずに落とす。許可されているのは `docs/` 配下と、失敗回数を記録する `.claude/skills/daily-report/failures.json` の 1 ファイルだけ。

日次レポートの生成は 20 以上の外部サイトから RSS / HTML を取得して読む。その記事タイトルや本文は第三者が書けるため、「これまでの指示を無視して〜」といった文章を仕込まれ、AI がそれを指示として実行してしまう余地がある（**間接プロンプトインジェクション**）。プロンプトに「`docs/` 配下のみ」と書くだけでは、誘導されれば破られる。**検査を AI のプロセスの外に置く**ことで、誘導されたセッション自身には無効化できない形にしている。SKILL.md 側にも、取得した文章を指示として扱わないルールを書いてある。

手順・執筆ルールは各 `.claude/skills/<name>/SKILL.md` が唯一の真実。README には転記しない。

## Tips を書く

`docs/tips/` は**運営者が書く解説記事**。「OpenRouter とは何か」のような、その日のニュースではなく前提知識にあたる話を置き、日次レポートの中から用語の説明としてリンクする。`/daily-report` はこれを読むだけで、書かない。

下書きは `/tip <テーマ>`（`.claude/skills/tip/`）で作れる。**自動実行はしない**（GitHub Actions が回すのは `/daily-report` と `/period-summary` だけ）。何を Tips にするかを決め、内容に責任を持つのは運営者。

1. **`docs/tips/<slug>.md` を作る。** ファイル名がそのまま URL と記事からの参照キー（`/tips/<slug>/`）になる。使えるのは英小文字・数字・ハイフンだけ（`openrouter.md` / `mcp.md`）。日本語や大文字を使うとビルドが落ちる
2. **frontmatter は 3 つ。**

   ```yaml
   ---
   title: "OpenRouter とは"
   description: "複数の LLM を 1 つの API で呼び分けられる中継サービス"
   updated: 2026-09-02
   ---
   ```

   - `description` は `/tips/` の一覧に出る 1 行。本文の書き出しを流用せず「何が分かる記事か」を書く
   - `updated` は書いた日・直した日。一覧はこの降順で並ぶ（内容を直したら上げる）

3. **本文は H2 区切りの markdown。** 体裁は日次レポートと共用（`Prose.astro`）
4. `npm run dev` で `/tips/` と `/tips/<slug>/` を目で見て commit

**記事から参照するとき**は `/tips/…` から書く（`/knowledge-flow/…` と書かない。公開先の接頭辞はビルド時に付く）。

```markdown
複数のモデルを切り替えて使える[OpenRouter](/tips/openrouter/)を土台にしている。
```

**slug を変える・Tips を消すときは、指している記事も直す。** 存在しない Tips へのリンクが残っているとビルドが落ちる（`getTips()` が記事本文を全件照合する）。対象は次で洗い出せる。

```sh
grep -rn '/tips/<slug>/' docs/blog/posts
```


設計の背景・方針は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照。
