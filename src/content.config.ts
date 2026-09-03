import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// docs/ = データ層（Skill だけが書く）／src/ = サイト層。この境界を跨がせない。
// スキーマに合わない frontmatter があればビルドが落ちる。壊れたページを公開するより早く気づける。
//
// ファイル名（post.id、例: "2026-07-17"）と frontmatter の date は運用上一致する想定だが、
// このスキーマは一致まで検証しない。表示には post.id ではなく、必ずこの date を使うこと
// （src/lib/date.ts の formatDate 経由）。一致しない場合は src/lib/posts.ts の getPosts() が
// ビルドを止める。
const posts = defineCollection({
	loader: glob({ base: './docs/blog/posts', pattern: '*.md' }),
	schema: z.object({
		date: z.coerce.date(),
		title: z.string(),
	}),
});

// 月・年のまとめ記事。id は期間キー（`2026-08` / `2026`）で、date は生成日
// （まとめた期間ではなく書いた日。トップページはこの日付の間だけ新着リンクを出す）。
const periods = defineCollection({
	loader: glob({ base: './docs/blog/periods', pattern: '*.md' }),
	schema: z.object({
		date: z.coerce.date(),
		title: z.string(),
	}),
});

// 解説記事（Tips）。posts / periods と違い、自動実行では増えず、運営者が必要なときに書く。
// id はそのまま URL（`/tips/<id>/`）になり、日次レポート本文からの参照キーにもなる。
const tips = defineCollection({
	loader: glob({ base: './docs/tips', pattern: '*.md' }),
	schema: z.object({
		title: z.string(),
		// 一覧に出す 1 行の説明。本文の書き出しを流用せず、何が分かる記事かを書く
		description: z.string(),
		updated: z.coerce.date(),
	}),
});

export const collections = { posts, periods, tips };
