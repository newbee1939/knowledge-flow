/**
 * サイト内リンクを組み立てる。
 *
 * `import.meta.env.BASE_URL` の末尾スラッシュの有無は astro.config の `trailingSlash` 設定に
 * 左右されるため、手で文字列連結すると `//` か、逆にスラッシュ欠落を招く。
 * 実際 PR #4 のレビューでこの点が誤検知され、指摘どおりに直すとリンクが壊れる状態だった。
 * 設定がどちらでも壊れないよう、ここで正規化する。
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const rest = path.replace(/^\//, '');
  return `${base}/${rest}`;
}
