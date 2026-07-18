import { describe, expect, it } from 'vitest';
import { buildTimeline, type TimelineEntry } from './timeline';

function entry(id: string): TimelineEntry {
	return { id, date: new Date(id), title: `title ${id}` };
}

describe('buildTimeline', () => {
	it('空配列なら空のタイムラインを返す', () => {
		expect(buildTimeline([])).toEqual([]);
	});

	it('年 → 月 → 日に集約する', () => {
		const result = buildTimeline([entry('2026-07-13'), entry('2026-07-14'), entry('2026-06-30')]);

		expect(result).toHaveLength(1);
		expect(result[0].year).toBe(2026);
		expect(result[0].months.map((m) => m.month)).toEqual([7, 6]);
		expect(result[0].months[0].entries.map((e) => e.id)).toEqual(['2026-07-14', '2026-07-13']);
		expect(result[0].months[1].entries.map((e) => e.id)).toEqual(['2026-06-30']);
	});

	it('年をまたぐと別の年に分かれ、新しい年が先に来る', () => {
		const result = buildTimeline([entry('2025-12-31'), entry('2026-01-01')]);

		expect(result.map((y) => y.year)).toEqual([2026, 2025]);
		expect(result[0].months[0].month).toBe(1);
		expect(result[1].months[0].month).toBe(12);
	});

	it('入力の順序に依存せず、新しい順に整列する', () => {
		const shuffled = [entry('2026-07-13'), entry('2026-07-17'), entry('2026-07-15')];
		const result = buildTimeline(shuffled);

		expect(result[0].months[0].entries.map((e) => e.id)).toEqual([
			'2026-07-17',
			'2026-07-15',
			'2026-07-13',
		]);
	});

	it('同じ年の別の月が離れて入力されても同じ月にまとまる', () => {
		const result = buildTimeline([entry('2026-07-01'), entry('2026-06-15'), entry('2026-07-20')]);

		expect(result[0].months.map((m) => m.month)).toEqual([7, 6]);
		expect(result[0].months[0].entries.map((e) => e.id)).toEqual(['2026-07-20', '2026-07-01']);
	});
});
