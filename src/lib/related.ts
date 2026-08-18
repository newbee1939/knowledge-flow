import type { PostArticle } from './articles';

/** 日次レポートの 1 記事と、同じ話題を扱った過去の記事 */
interface RelatedGroup {
	article: PostArticle;
	related: PostArticle[];
}

/**
 * 関連判定に使うカテゴリ。ジャンル（AI / Infra / …）は全記事に必ず付いていて、
 * これを含めると「同じ日の AI 記事すべてが関連」になってしまうため落とす。
 */
const topicsOf = (article: PostArticle): string[] =>
	article.categories.filter((category) => category !== article.genre);

/** カテゴリごとの記事数 */
const countByTopic = (articles: PostArticle[]): Map<string, number> =>
	articles.reduce<Map<string, number>>((counts, article) => {
		topicsOf(article).forEach((topic) => {
			counts.set(topic, (counts.get(topic) ?? 0) + 1);
		});
		return counts;
	}, new Map());

/**
 * 指定した日次レポートの各記事について、カテゴリを共有する過去の記事を返す。
 *
 * - 関連は**過去に向かってのみ**張る。その日より後の記事は、書いた時点では存在しない
 * - 珍しいカテゴリでの一致ほど強く効かせる（`Qwen` の一致は「続き」だが、100 件超ある
 *   `Security` や `LLM` の一致は「たまたま同じジャンル」でしかない）。同点なら渡された順
 * - 1 件も見つからない記事は結果に含めない（呼び出し側で空判定を書かずに済む）
 */
export function collectRelated(articles: PostArticle[], postId: string, limit = 3): RelatedGroup[] {
	const counts = countByTopic(articles);

	return articles
		.filter((article) => article.postId === postId)
		.map((article) => {
			const topics = new Set(topicsOf(article));
			const related = articles
				.filter((other) => other.date < article.date)
				.map((other) => ({
					other,
					score: topicsOf(other)
						.filter((topic) => topics.has(topic))
						.reduce((sum, topic) => sum + 1 / (counts.get(topic) ?? 1), 0),
				}))
				.filter(({ score }) => score > 0)
				.sort((a, b) => b.score - a.score)
				.slice(0, limit)
				.map(({ other }) => other);
			return { article, related };
		})
		.filter((group) => group.related.length > 0);
}
