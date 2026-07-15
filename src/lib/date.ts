/**
 * 記事の日付を表示用の `YYYY-MM-DD`（UTC）に整形する。
 *
 * `docs/blog/posts/<DATE>.md` の `<DATE>` と frontmatter の `date` は運用上一致する想定だが、
 * 表示にファイル名（`post.id`）をそのまま使うと、両者が食い違ったときに一覧ページと
 * 詳細ページで違う日付が出てしまう。常に frontmatter の `date`（型付き）を単一の情報源にする。
 */
export function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}
