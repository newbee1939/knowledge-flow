import { getCollection } from 'astro:content';
import { extractArticles, type PostArticle } from './articles';
import { formatDate } from './date';
import { findBrokenTipLinks } from './tips';

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

/**
 * 月・年のまとめ記事を返す（期間の新しい順）。
 *
 * **id が期間キー（`YYYY-MM` / `YYYY`）でなければビルドを止める。** id はそのまま URL になり、
 * 年表の年・月ラベルからのリンク先の照合キーにもなる。ずれていても表示は静かにリンク無しへ
 * 戻るだけで、書いたのにどこからも辿れない記事ができてしまう。
 */
export async function getPeriods() {
	const periods = await getCollection('periods');

	const invalid = periods.find((period) => !/^\d{4}(-\d{2})?$/.test(period.id));
	if (invalid) {
		throw new Error(
			`まとめ記事 ${invalid.id} のファイル名が期間キーになっていません。\n` +
				'  - docs/blog/periods/ のファイル名は 2026-08.md（月）または 2026.md（年）にしてください。',
		);
	}

	return periods.sort((a, b) => b.id.localeCompare(a.id));
}

/**
 * 全レポートを横断して記事一覧を返す（新しい順）。
 *
 * **同じ URL が 2 記事以上に付いていたらビルドを止める。** この誤りは HTTP 的には
 * 正常に見えるため、リンク切れ検査では捕まえられない。実際に 2 種類の壊れ方をしていた。
 *
 * - 別記事の URL が紛れ込む: 07-20 の「Windows 11 の不具合」に「Gemma 4」の URL が付き、
 *   リンク先は 200 を返すのに中身は別の記事だった
 * - 同じニュースが日付違いで何度も載る: のべ 40 件。カテゴリページは「その技術単一の
 *   歴史を縦に辿る」ためのものなので、同じ記事が並ぶと用をなさなくなる
 */
export async function getArticles(): Promise<PostArticle[]> {
	const posts = await getPosts();
	const articles = posts.flatMap((post) =>
		extractArticles({ postId: post.id, date: post.data.date, body: post.body ?? '' }),
	);

	const byUrl = Map.groupBy(articles, (article) => article.url);
	const duplicated = [...byUrl.values()].filter((group) => group.length > 1);

	if (duplicated.length > 0) {
		const detail = duplicated
			.map(
				(group) =>
					`  ${group[0].url}\n` +
					group.map((article) => `    - ${article.postId}: ${article.title}`).join('\n'),
			)
			.join('\n');
		throw new Error(
			`同じ URL が複数の記事に付いています（${duplicated.length} 件）。ビルドを中止しました。\n` +
				`${detail}\n` +
				'  - 別々のニュースなら、どちらかの URL が誤っています\n' +
				'  - 同じニュースなら、日付・内容の良い方を残して片方を削除してください',
		);
	}

	return articles;
}

/**
 * 手書きの解説記事（Tips）を更新日の新しい順に返す。
 *
 * **id が slug（英小文字・数字・ハイフン）でなければビルドを止める。** id はそのまま
 * URL になり、日次レポート本文からの参照キー（`/tips/<id>/`）にもなる。日本語や大文字が
 * 混じると、記事側からリンクを書くたびにエンコードの差でリンク切れを踏む。
 *
 * **日次レポートから存在しない Tips へリンクしていてもビルドを止める。** 記事と Tips の
 * 両方を持っているのはここだけで、他に照合できる場所がない（詳細は findBrokenTipLinks）。
 */
export async function getTips() {
	const tips = await getCollection('tips');

	const invalid = tips.find((tip) => !/^[a-z0-9-]+$/.test(tip.id));
	if (invalid) {
		throw new Error(
			`Tips ${invalid.id} のファイル名が slug になっていません。\n` +
				'  - docs/tips/ のファイル名は英小文字・数字・ハイフンだけにしてください（例: openrouter.md）。',
		);
	}

	const posts = await getPosts();
	const broken = findBrokenTipLinks(
		posts.map((post) => ({ id: post.id, body: post.body ?? '' })),
		tips.map((tip) => tip.id),
	);
	if (broken.length > 0) {
		const detail = broken.map(({ postId, slug }) => `  ${postId} → /tips/${slug}/`).join('\n');
		throw new Error(
			`存在しない Tips へのリンクがあります（${broken.length} 件）。ビルドを中止しました。\n` +
				`${detail}\n` +
				'  - docs/tips/<slug>.md があるか、記事側の slug の綴りを確認してください',
		);
	}

	return tips.sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}
