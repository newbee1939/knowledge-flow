# knowledge-flow — 開発ルール

## 実装方針

- 最小実装を選ぶ。痛みを感じてから機能・抽象化を追加する
- シンプルで読みやすく、保守しやすいコードを書く

## ブランチ・PR ワークフロー

**1 タスク（TASK.md 1項目）= 1 ブランチ = 1 PR**

```
# ブランチ命名: <phase>/<task-id>/<slug>
git switch main && git pull
git switch -c <phase>/<task-id>/<slug>
```

コミットメッセージ: `<type>: <概要> (<task-id>)`
type: `feat` / `fix` / `chore` / `docs` / `style` / `refactor` / `ci`

## セルフレビュー（PR 前に確認）

- [ ] TASK.md の DoD をすべて満たしているか
- [ ] TASK.md のチェックボックスを `- [x]` に更新したか
- [ ] 最小実装か（余計な機能がないか）
