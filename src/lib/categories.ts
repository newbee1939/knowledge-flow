import GithubSlugger from 'github-slugger';
import type { PostArticle } from './articles';

export interface Category {
	name: string;
	/** URL 用のスラグ（`/categories/<slug>/`）。名前の大文字・スペースを URL に出さないための変換 */
	slug: string;
	/** このカテゴリの記事。渡された articles の順序を保つ（呼び出し側が新しい順で渡す前提） */
	articles: PostArticle[];
}

/**
 * 記事一覧をカテゴリ別に集約する。
 *
 * - カテゴリの並びは記事数の多い順 → 名前順（カテゴリ一覧ページの表示順）
 * - 各カテゴリ内の記事順は入力順を保つ。getPosts()（新しい順）を flatMap した結果を
 *   そのまま渡せば、新しい順のまま集約される
 * - slug は並び確定後に採番する。名前が異なっても slug が衝突した場合は
 *   github-slugger が `-1` サフィックスで一意化する
 */
export function collectCategories(articles: PostArticle[]): Category[] {
	const byName = articles.reduce<Map<string, PostArticle[]>>((map, article) => {
		article.categories.forEach((name) => {
			map.set(name, [...(map.get(name) ?? []), article]);
		});
		return map;
	}, new Map());

	const slugger = new GithubSlugger();
	return [...byName.entries()]
		.sort(
			([aName, aArticles], [bName, bArticles]) =>
				bArticles.length - aArticles.length || aName.localeCompare(bName, 'en'),
		)
		.map(([name, categoryArticles]) => ({
			name,
			slug: slugger.slug(name),
			articles: categoryArticles,
		}));
}
