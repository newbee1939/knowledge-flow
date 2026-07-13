# Tech News Timeline

> **ステータス: 確定版。** 本ドキュメントは合意済みの設計仕様。方針を変える場合は本ファイルを改訂し、PR で履歴を残す。実装中の小さな揺らぎは TASK.md 側で吸収する。

「今日のテックを線で理解できる」一人運営のテックニュースメディア。日次レポートを **年→月→日のタイムライン** で横断表示する。

**実装方針: Claude Code Skill で完結させる。** コードを書くのは静的サイトの最小設定だけ。fetch・分類・要約・執筆はすべて Skill 内の自然言語指示で行う。

**デザイン方針: モノクロ・ミニマル・洗練。** 白黒（＋極小のアクセント）、装飾を足さず **余白とタイポグラフィの精度** で勝負。年→月→日を横スクロールするタイムラインが主役。mkdocs-material 既定の見た目は**消す**（カスタム CSS で上書き）。

---

## アーキテクチャ

```
毎朝（scheduled agent）
  └─ .claude/skills/daily-report/SKILL.md
       ├─ 情報ソース（下記）から記事取得 ─ WebFetch / curl
       ├─ ai / frontend / backend / infra / others に分類
       ├─ レポート本文を執筆（JP/EN を両方生成 ※P5）
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
│   ├── daily-report/SKILL.md        # 日次（メイン）
│   ├── monthly-summary/SKILL.md     # 月末バッチ（P4）
│   ├── yearly-summary/SKILL.md      # 年末バッチ（P4）
│   └── publish/SKILL.md             # X / Spotify 配信（P6）
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

## Skill の内容・情報ソース

**唯一の真実は `.claude/skills/daily-report/SKILL.md`。** 手順・執筆ルール・レポートのスキーマ・情報ソース一覧はすべてそちらに書く。本ドキュメントには転記しない（二重管理は必ずドリフトするため）。

各 Phase で追加する Skill も同様に `.claude/skills/<name>/SKILL.md` を唯一の真実とする。

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

### P2 終了レビュー — Astro 移行ゲート

P2 完了時点で **タイムライン UI を mkdocs の HTML-in-markdown で組んでいて 1 日以上沼ったら、Astro 移行を発議する**。

- 移行先は [Astro](https://astro.build/)（Content Collections + 内蔵 i18n）
- posts の markdown と CSS はほぼそのまま持ち込めるので、移行コストが低いうちに決断する
- 移行する場合は「設計原則」節の Skill-as-Pipeline / Markdown-as-Database は維持。「ファイル構成」節の「`src/` / `package.json` を作らない」方針は破る前提で書き換える
- 沼らなければ mkdocs-material のまま P3 へ進む（[[feedback-simple-first]]）
