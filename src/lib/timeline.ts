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

	return sorted.reduce<TimelineYear[]>((years, entry) => {
		const entryYear = entry.date.getUTCFullYear();
		const entryMonth = entry.date.getUTCMonth() + 1;

		const lastYearGroup = years.at(-1);
		if (lastYearGroup?.year !== entryYear) {
			years.push({ year: entryYear, months: [{ month: entryMonth, entries: [entry] }] });
			return years;
		}

		const lastMonthGroup = lastYearGroup.months.at(-1);
		if (lastMonthGroup?.month !== entryMonth) {
			lastYearGroup.months.push({ month: entryMonth, entries: [entry] });
			return years;
		}

		lastMonthGroup.entries.push(entry);
		return years;
	}, []);
}
