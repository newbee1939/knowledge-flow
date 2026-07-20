import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';
import { withBase } from '../lib/url';

// 読者向けフィード。posts からビルド時に導出する（設計原則 Derived-not-Generated）。
// XML のエスケープは @astrojs/rss に任せる（記事タイトルに & や < が入っても壊れない）。
export async function GET(context: APIContext) {
	const posts = await getPosts();

	// site は astro.config.mjs の site。無ければ絶対 URL を組めず、リンクが壊れたフィードが出る。
	if (!context.site) {
		throw new Error('astro.config.mjs の site が未設定のため rss.xml を生成できません。');
	}

	return rss({
		title: 'knowledge-flow',
		description: 'Daily Tech Report',
		// site 直下ではなく base 配下がサイトのトップ（プロジェクトページ公開のため）。
		site: new URL(withBase('/'), context.site),
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.date,
			link: withBase(`blog/${post.id}/`),
		})),
	});
}
