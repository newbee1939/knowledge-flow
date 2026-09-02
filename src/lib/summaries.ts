import { z } from 'astro/zod';
import summariesJson from '../../docs/blog/summaries.json';
import { getPeriodKey } from './periods';

/**
 * summaries.json の形を実行時に検証する。
 *
 * このファイルは posts / periods と違い Content Collections を通らないため、
 * スキーマ検証が効かない。型注釈だけ書いても実行時には何も確かめられず、
 * 形が崩れてもビルドは通り、**ひとことタイトルだけが静かに消える**。
 * 月初に Period Summary ワークフローが機械的に書き換える以上、
 * 「壊れたデータはビルドで落とす」を他のコレクションと揃える。
 *
 * TODO: できればexportを辞めたい
 */
export function parseSummaries(json: unknown) {
	const schema = z.object({
		overall: z.record(z.string(), z.string()),
		categories: z.record(z.string(), z.record(z.string(), z.string())),
	});

	const parsed = schema.safeParse(json);
	if (!parsed.success) {
		throw new Error(
			'docs/blog/summaries.json の形が壊れています。ビルドを中止しました。\n' +
				`${z.prettifyError(parsed.error)}\n` +
				'  - { "overall": { "2026-08": "..." }, "categories": { "AI": { "2026-08": "..." } } } の形にしてください',
		);
	}
	return parsed.data;
}

const { overall, categories } = parseSummaries(summariesJson);

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
