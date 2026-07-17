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

export const collections = { posts };
