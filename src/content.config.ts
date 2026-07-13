import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// docs/ = データ層（Skill だけが書く）。src/ = サイト層。この境界を跨がせない。
// スキーマに合わない frontmatter があればビルドが落ちる。壊れたページを公開するより早く気づける。
const posts = defineCollection({
  loader: glob({ base: './docs/blog/posts', pattern: '*.md' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
  }),
});

export const collections = { posts };
