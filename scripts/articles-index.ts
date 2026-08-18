// 過去の日次レポートに載せた全記事を TSV で出力する。
// 日次レポート生成 Skill が「この話題は前にも扱ったか」を grep で引くための索引。
//
// 列: 日付 / カテゴリ（| 区切り） / タイトル / サイト内リンク / 元記事 URL
// サイト内リンクの見出しアンカーはサイト側と同じ関数（extractArticles）で採るので、
// 手で組み立てたときのような取りこぼしが起きない。
import { readdirSync, readFileSync } from 'node:fs';
import { extractArticles } from '../src/lib/articles.ts';

const DIR = 'docs/blog/posts';

const rows = readdirSync(DIR)
	.filter((name) => name.endsWith('.md'))
	.sort()
	.reverse()
	.flatMap((name) => {
		const postId = name.replace(/\.md$/, '');
		// frontmatter を落として本文だけ渡す（date はファイル名と一致する運用）
		const body = readFileSync(`${DIR}/${name}`, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
		return extractArticles({ postId, date: new Date(postId), body });
	})
	.map((article) =>
		[
			article.postId,
			article.categories.join('|'),
			article.title,
			`/blog/${article.postId}/#${article.anchor}`,
			article.url,
		].join('\t'),
	);

console.log(rows.join('\n'));
