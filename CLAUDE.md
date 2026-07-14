# knowledge-flow — 開発ルール

## 実装方針

- 最小実装を選ぶ。痛みを感じてから機能・抽象化を追加する
- シンプルで読みやすく、保守しやすいコードを書く

## Node のバージョン

- **`.tool-versions` が唯一の真実。** ローカルは **mise**、CI は `setup-node` が、**どちらもこのファイルをそのまま読む**
- `.nvmrc` は使わない。**mise は `.nvmrc` を既定で読まない**（idiomatic version files は既定で無効）ため、置いても無視され、ローカルと CI で Node がズレる
- バージョンを上げるときは `.tool-versions` を1行直すだけ。ローカルは `mise install` で追従する

## テスト

- **ロジックを書いたらテストも書く。** 対象は `src/lib/` などの純粋な関数・データ変換
- 置き場所は**テスト対象と同じ階層に `*.test.ts`**（`src/lib/url.ts` → `src/lib/url.test.ts`）。専用の `tests/` ディレクトリは作らない
- テストランナーは **Vitest**（`npm test`）。CI で必ず回る
- **テストを書かないもの**: `.astro` のテンプレート（見た目は目で見る。P2-10 のレスポンシブ確認で担保）、外部 API を叩くだけのコード
- **「壊れたら気づけない」ものを優先してテストする。** カバレッジの数字は追わない

## Lint / Format

- **Biome**（`npm run lint` / `npm run lint:fix`）。ESLint + Prettier は使わない（依存を増やさない）
- CI で `npm run lint` が回る。フォーマット差分があれば落ちる

## GitHub Actions

- **Action はタグではなくコミットハッシュで固定する。** タグは書き換え可能なので、リポジトリが乗っ取られれば `@v7` が別のコミットを指しうる（サプライチェーン攻撃）
- 末尾に `# v7.0.0` のようにバージョンをコメントで残す。Dependabot はこれを見て更新 PR を出す

```yaml
- uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
```

- ワークフローで**信用できない入力**（issue タイトル、PR 本文、コミットメッセージ等）を `run:` に直接埋め込まない。`env:` 経由で渡す（コマンドインジェクション対策）

## ブランチ・PR ワークフロー

- 基本的には**1 タスク（TASK.md 1項目）= 1 ブランチ = 1 PR**
    - 必要に応じて複数タスクを1つのPRにまとめるのは許可
- 以下を実行してからタスクを開始する

```
# ブランチ命名: feature/任意の命名
git co main && git pull origin main
git co -b feature/任意の命名
```

コミットメッセージ: `<type>: <概要> (<task-id>)`
type: `feat` / `fix` / `chore` / `docs` / `style` / `refactor` / `ci`

- PR上でAIによるレビューが来るので対応する
    - 修正したら、それぞれのコメントに返信した上でコメントをResolveする
- 必ず出ているPRをマージしてから次のタスクに進む

## セルフレビュー（PR 前に確認）

- [ ] TASK.md の DoD をすべて満たしているか
- [ ] TASK.md のチェックボックスを `- [x]` に更新したか
- [ ] 最小実装か（余計な機能がないか）
- [ ] ロジックを足したなら、隣に `*.test.ts` を書いたか
- [ ] `npm run lint && npm test && npm run build` がローカルで通るか
