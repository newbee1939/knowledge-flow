import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
	it('UTC の日付を YYYY-MM-DD に整形する', () => {
		expect(formatDate(new Date('2026-07-13T00:00:00.000Z'))).toBe('2026-07-13');
	});

	it('時刻部分を切り捨てる', () => {
		expect(formatDate(new Date('2026-07-13T23:59:59.999Z'))).toBe('2026-07-13');
	});
});
