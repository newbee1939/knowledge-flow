import { describe, expect, it } from 'vitest';
import summaries from '../../docs/blog/summaries.json';
import { periodTitle } from './summaries';

// summaries.json の中身は月ごとに増えるため、値をテストに直書きせずファイル自体を正とする。
// 検証したいのは「JSON のキーを year / month / category から復元できるか」（0 埋めの有無など）だけ。
const casesOf = (titles: Record<string, string>, category?: string) =>
	Object.entries(titles).map(([key, expected]) => {
		const [year, month] = key.split('-').map(Number);
		return { key, year, month, category, expected };
	});

describe('periodTitle', () => {
	const cases = [
		...casesOf(summaries.overall),
		...Object.entries(summaries.categories).flatMap(([name, titles]) => casesOf(titles, name)),
	];

	it.each(cases)(
		'$category $key を year / month から引ける',
		({ year, month, category, expected }) => {
			expect(periodTitle({ year, month, category })).toBe(expected);
		},
	);

	it('タイトルが無い期間・カテゴリは undefined を返す', () => {
		expect(periodTitle({ year: 1999, month: 1 })).toBeUndefined();
		expect(periodTitle({ year: 1999 })).toBeUndefined();
		expect(periodTitle({ year: 2026, month: 7, category: '存在しないカテゴリ' })).toBeUndefined();
	});
});
