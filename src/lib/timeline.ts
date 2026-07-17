export interface TimelineEntry {
	id: string;
	date: Date;
	title: string;
}

export interface TimelineMonth {
	/** 1〜12 */
	month: number;
	entries: TimelineEntry[];
}

export interface TimelineYear {
	year: number;
	months: TimelineMonth[];
}

/**
 * posts を年 → 月 → 日のタイムライン構造に集約する（P2-7）。
 *
 * 年・月・記事のすべてが新しい順。日付は formatDate（src/lib/date.ts）と同じく
 * UTC で解釈する。frontmatter の date は日付のみ（時刻なし）で UTC 深夜 0 時として
 * パースされるため、ローカルタイムゾーンで読むと日付がずれる。
 */
export function buildTimeline(entries: TimelineEntry[]): TimelineYear[] {
	const sorted = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());

	const years: TimelineYear[] = [];
	for (const entry of sorted) {
		const y = entry.date.getUTCFullYear();
		const m = entry.date.getUTCMonth() + 1;

		let year = years.at(-1);
		if (!year || year.year !== y) {
			year = { year: y, months: [] };
			years.push(year);
		}

		let month = year.months.at(-1);
		if (!month || month.month !== m) {
			month = { month: m, entries: [] };
			year.months.push(month);
		}

		month.entries.push(entry);
	}
	return years;
}
