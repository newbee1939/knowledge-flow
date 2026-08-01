import summaries from '../../docs/blog/summaries.json';

/**
 * 月・年をひとことでまとめたタイトル。キーは月が `YYYY-MM`、年が `YYYY`。
 *
 * 実体は docs/blog/summaries.json で、月初に Period Summary ワークフローが追記する
 * （.claude/skills/period-summary/SKILL.md）。まだ書かれていない期間は undefined。
 */
export function periodTitle(year: number, month?: number): string | undefined {
	const key = month === undefined ? String(year) : `${year}-${String(month).padStart(2, '0')}`;
	return (summaries as Record<string, string>)[key];
}
