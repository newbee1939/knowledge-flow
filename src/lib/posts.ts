import { getCollection } from 'astro:content';
import { formatDate } from './date';

/**
 * 日次レポートを新しい順に返す。
 *
 * **0 件ならビルドを止める。** Astro はコレクションが空でも警告を出すだけでビルドを成功させ、
 * 記事ゼロのページを平然と出力する。docs/ のパスがずれたり content.config.ts が壊れたりすると、
 * 空のサイトが静かに公開されてしまう（毎朝の自動更新では誰も気づかない）。
 * 空のサイトを公開するくらいなら、ビルドを落として気づいたほうがいい。
 *
 * **post.id と frontmatter date の食い違いもビルドを止める。** 一致は運用上の想定でしかなく、
 * スキーマは検証しない（content.config.ts 参照）。放置すると一覧・詳細ページで違う日付が出る。
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

	const mismatched = posts.find((post) => post.id !== formatDate(post.data.date));
	if (mismatched) {
		throw new Error(
			`記事 ${mismatched.id} のファイル名と frontmatter date（${formatDate(mismatched.data.date)}）が一致しません。\n` +
				`  - docs/blog/posts/${mismatched.id}.md の date を確認してください。`,
		);
	}

	return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
