import { readdirSync, readFileSync } from 'node:fs';
import { extractArticles } from '../src/lib/articles.ts';

/**
 * 過去の全記事を TSV で標準出力する（日付 / カテゴリ / タイトル / サイト内リンク）。
 *
 * daily-report skill が「今日のニュースに関連する過去記事」を grep で探すための索引。
 * サイトのビルドには関与せず、出力はコミットもしない（都度作り直す使い捨て）。
 *
 * リンクの `#アンカー` はサイト本体と同じ extractArticles で算出する。手で組み立てると
 * 記号や重複見出しの扱いでズレるうえ、ズレてもリンクは切れずページ先頭に着地するため、
 * 間違いに気づけない。
 */
const POSTS_DIR = 'docs/blog/posts';

const rows = readdirSync(POSTS_DIR)
	.filter((file) => file.endsWith('.md'))
	.sort()
	.flatMap((file) => {
		const postId = file.replace(/\.md$/, '');
		const body = readFileSync(`${POSTS_DIR}/${file}`, 'utf8');
		return extractArticles({ postId, date: new Date(postId), body });
	})
	.map((article) =>
		[
			article.postId,
			article.categories.join('/'),
			article.title,
			`/blog/${article.postId}/#${article.anchor}`,
		].join('\t'),
	);

console.log(rows.join('\n'));
