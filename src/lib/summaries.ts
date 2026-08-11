import summariesJson from '../../docs/blog/summaries.json';
import { getPeriodKey } from './periods';

const {
	overall,
	categories,
}: {
	overall: Record<string, string>;
	categories: Record<string, Record<string, string>>;
} = summariesJson;

interface Period {
	year: number;
	/** 1〜12。省略すると年のタイトル */
	month?: number;
	/** カテゴリ名（例: "AI Agent"）。省略するとサイト全体のタイトル */
	category?: string;
}

/**
 * 月・年をひとことでまとめたタイトル。キーは月が `YYYY-MM`、年が `YYYY`。
 *
 * 実体は docs/blog/summaries.json で、月初に Period Summary ワークフローが追記する
 * （.claude/skills/period-summary/SKILL.md）。まだ書かれていない期間は undefined。
 */
export function getPeriodTitle({ year, month, category }: Period): string | undefined {
	const key = getPeriodKey({ year, month });
	const titles = category === undefined ? overall : (categories[category] ?? {});
	return titles[key];
}
