import { describe, expect, it } from 'vitest';
import { getPeriodKey, getPeriodLabel } from './periods';

describe('getPeriodKey', () => {
	it('月は 0 埋めした YYYY-MM', () => {
		expect(getPeriodKey({ year: 2026, month: 8 })).toBe('2026-08');
		expect(getPeriodKey({ year: 2026, month: 12 })).toBe('2026-12');
	});

	it('月を省略すると YYYY', () => {
		expect(getPeriodKey({ year: 2026 })).toBe('2026');
	});
});

describe('getPeriodLabel', () => {
	it('月は 0 埋めせずに表示する', () => {
		expect(getPeriodLabel('2026-08')).toBe('2026年8月まとめ');
		expect(getPeriodLabel('2026-12')).toBe('2026年12月まとめ');
	});

	it('年はそのまま', () => {
		expect(getPeriodLabel('2026')).toBe('2026年まとめ');
	});
});
