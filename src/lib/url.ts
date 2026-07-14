/**
 * サイト内リンクを組み立てる。
 *
 * `import.meta.env.BASE_URL` の末尾スラッシュの有無は astro.config の `trailingSlash` 設定に
 * 左右されるため、手で文字列連結すると `//` か、逆にスラッシュ欠落を招く。
 * 実際 PR #4 のレビューでこの点が誤検知され、指摘どおりに直すとリンクが壊れる状態だった。
 * 設定がどちらでも壊れないよう、ここで正規化する。
 *
 * `base` を引数で受け取れるのはテストのため（`import.meta.env` を差し替えずに両パターンを試せる）。
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
	const normalizedBase = base.replace(/\/+$/, '');
	const normalizedPath = path.replace(/^\/+/, '');
	return `${normalizedBase}/${normalizedPath}`;
}
