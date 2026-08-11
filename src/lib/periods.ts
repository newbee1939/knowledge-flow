/** 期間キー。月は `YYYY-MM`、年は `YYYY`。まとめ記事の id と summaries.json のキーで共通。 */
export function getPeriodKey({ year, month }: { year: number; month?: number }): string {
	return month === undefined ? String(year) : `${year}-${String(month).padStart(2, '0')}`;
}

/** 期間キーの表示名（例: `2026-08` → `2026年8月まとめ`）。 */
export function getPeriodLabel(key: string): string {
	const [year, month] = key.split('-');
	return month === undefined ? `${year}年まとめ` : `${year}年${Number(month)}月まとめ`;
}
