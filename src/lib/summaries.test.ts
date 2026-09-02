import { describe, expect, it } from 'vitest';
import summaries from '../../docs/blog/summaries.json';
import { getPeriodTitle, parseSummaries } from './summaries';

// summaries.json の中身は月ごとに増えるため、値をテストに直書きせずファイル自体を正とする。
// 検証したいのは「JSON のキーを year / month / category から復元できるか」（0 埋めの有無など）だけ。
const casesOf = (titles: Record<string, string>, category?: string) =>
	Object.entries(titles).map(([key, expected]) => {
		const [year, month] = key.split('-').map(Number);
		return { key, year, month, category, expected };
	});

describe('getPeriodTitle', () => {
	const cases = [
		...casesOf(summaries.overall),
		...Object.entries(summaries.categories).flatMap(([name, titles]) => casesOf(titles, name)),
	];

	it.each(cases)(
		'$category $key を year / month から引ける',
		({ year, month, category, expected }) => {
			expect(getPeriodTitle({ year, month, category })).toBe(expected);
		},
	);

	it('タイトルが無い期間・カテゴリは undefined を返す', () => {
		expect(getPeriodTitle({ year: 1999, month: 1 })).toBeUndefined();
		expect(getPeriodTitle({ year: 1999 })).toBeUndefined();
		expect(
			getPeriodTitle({ year: 2026, month: 7, category: '存在しないカテゴリ' }),
		).toBeUndefined();
	});
});

// 月初に Period Summary ワークフローが機械的に書き換えるファイルなので、
// 形が崩れたまま「タイトルだけ静かに消えたサイト」を公開しないことを保証する。
describe('parseSummaries', () => {
	it('正しい形はそのまま返す', () => {
		const json = { overall: { '2026-08': 'まとめ' }, categories: { AI: { '2026-08': 'AI' } } };
		expect(parseSummaries(json)).toEqual(json);
	});

	it('categories が空でも通る', () => {
		expect(parseSummaries({ overall: {}, categories: {} })).toEqual({
			overall: {},
			categories: {},
		});
	});

	it.each([
		['キーが足りない', { overall: {} }],
		['タイトルが文字列でない', { overall: { '2026-08': 1 }, categories: {} }],
		['categories の入れ子が 1 段足りない', { overall: {}, categories: { AI: '2026-08' } }],
	])('%s ならビルドを止める', (_name, json) => {
		expect(() => parseSummaries(json)).toThrow('summaries.json の形が壊れています');
	});
});
