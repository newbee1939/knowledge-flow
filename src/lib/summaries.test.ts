import { describe, expect, it } from 'vitest';
import summaries from '../../docs/blog/summaries.json';
import { periodTitle } from './summaries';

describe('periodTitle', () => {
	// summaries.json の中身は月ごとに増えるため、値をテストに直書きせずファイル自体を正とする。
	// 検証したいのは「JSON のキーを year / month から復元できるか」（0 埋めの有無など）だけ。
	it.each(Object.keys(summaries))('%s のキーを year / month から引ける', (key) => {
		const [year, month] = key.split('-').map(Number);
		expect(periodTitle(year, month)).toBe((summaries as Record<string, string>)[key]);
	});

	it('タイトルが無い期間は undefined を返す', () => {
		expect(periodTitle(1999, 1)).toBeUndefined();
		expect(periodTitle(1999)).toBeUndefined();
	});
});
