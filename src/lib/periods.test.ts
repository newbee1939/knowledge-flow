import { describe, expect, it } from 'vitest';
import { periodKey, periodLabel } from './periods';

describe('periodKey', () => {
	it('月は 0 埋めした YYYY-MM', () => {
		expect(periodKey({ year: 2026, month: 8 })).toBe('2026-08');
		expect(periodKey({ year: 2026, month: 12 })).toBe('2026-12');
	});

	it('月を省略すると YYYY', () => {
		expect(periodKey({ year: 2026 })).toBe('2026');
	});
});

describe('periodLabel', () => {
	it('月は 0 埋めせずに表示する', () => {
		expect(periodLabel('2026-08')).toBe('2026年8月まとめ');
		expect(periodLabel('2026-12')).toBe('2026年12月まとめ');
	});

	it('年はそのまま', () => {
		expect(periodLabel('2026')).toBe('2026年まとめ');
	});
});
