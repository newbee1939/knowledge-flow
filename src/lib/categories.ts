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
 * 並び替え用のキー。先頭の記号を落として字面で比較するため、`.NET` は N の位置に並ぶ。
 * 記号のまま比較すると、探している文字の場所に無い項目が一覧の先頭に居座ってしまう。
 */
const sortKey = (name: string): string => name.replace(/^[^\p{L}\p{N}]+/u, '');

/**
 * 記事一覧をカテゴリ別に集約する。
 *
 * - カテゴリの並びは名前順（カテゴリ一覧ページの表示順）。スマホでも目的のカテゴリを
 *   予測しながら追えるよう、記事数ではなくアルファベット順で固定する
 * - 各カテゴリ内の記事順は入力順を保つ。getPosts()（新しい順）を flatMap した結果を
 *   そのまま渡せば、新しい順のまま集約される
 * - slug は並び確定後に採番する。名前が異なっても slug が衝突した場合は
 *   github-slugger が `-1` サフィックスで一意化する
 */
export function collectCategories(articles: PostArticle[]): Category[] {
	const byName = articles.reduce<Map<string, PostArticle[]>>((map, article) => {
		article.categories.forEach((name) => {
			const list = map.get(name);
			if (list) {
				list.push(article);
			} else {
				map.set(name, [article]);
			}
		});
		return map;
	}, new Map());

	const slugger = new GithubSlugger();
	return [...byName.entries()]
		.sort(([aName], [bName]) => sortKey(aName).localeCompare(sortKey(bName), 'en'))
		.map(([name, categoryArticles]) => ({
			name,
			slug: slugger.slug(name),
			articles: categoryArticles,
		}));
}
