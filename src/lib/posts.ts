import { getCollection } from 'astro:content';

/**
 * 日次レポートを新しい順に返す。
 *
 * **0 件ならビルドを止める。** Astro はコレクションが空でも警告を出すだけでビルドを成功させ、
 * 記事ゼロのページを平然と出力する。docs/ のパスがずれたり content.config.ts が壊れたりすると、
 * 空のサイトが静かに公開されてしまう（毎朝の自動更新では誰も気づかない）。
 * 空のサイトを公開するくらいなら、ビルドを落として気づいたほうがいい。
 */
export async function getPosts() {
  const posts = await getCollection('posts');

  if (posts.length === 0) {
    throw new Error(
      'posts が 0 件です。ビルドを中止しました。\n' +
        '  - docs/blog/posts/ に .md があるか\n' +
        '  - src/content.config.ts の loader の base パスが正しいか\n' +
        '  - 古いキャッシュが悪さをしていないか（node_modules/.astro を消して再ビルド）',
    );
  }

  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
