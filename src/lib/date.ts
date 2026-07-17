/**
 * Date を表示用の `YYYY-MM-DD`（UTC）に整形する。
 *
 * 記事の日付表示には必ずこの関数へ frontmatter の `date` を渡すこと。
 * ファイル名由来の `post.id` を使わない理由は content.config.ts 参照。
 */
export function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}
