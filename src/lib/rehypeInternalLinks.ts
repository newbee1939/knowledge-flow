import type { HastNode } from './rehypeExternalLinks';

/**
 * 記事本文に書いたサイト内リンク（`/blog/2026-08-19/#…`）の先頭に、
 * 公開先のディレクトリ名（base = `/knowledge-flow`）を足す。
 *
 * このサイトは https://newbee1939.github.io/knowledge-flow/ 配下、つまりドメイン直下ではなく
 * 1 階層下に置かれている。ブラウザは `/` で始まるリンクをドメイン直下から辿るので、
 * `/blog/…` のままでは https://newbee1939.github.io/blog/… を探しに行って 404 になる。
 * Astro は markdown 本文中のリンクには手を加えないため、ここで足す。
 *
 * 記事側は `/blog/…` とだけ書けばよい形にしてある。公開先が変わっても過去記事を
 * 一括置換せずに済む。
 */
export function prefixInternalLinks(node: HastNode, base: string): void {
	if (node.type === 'element' && node.tagName === 'a') {
		const href = node.properties?.href;
		// 足すのは `/blog/…` のようなサイト内の絶対パスだけ。
		// `//example.com` は http/https の指定を省いた外部リンクなので対象外。
		// 既に `/knowledge-flow/…` になっているリンクも、二重に付くので除く。
		if (
			typeof href === 'string' &&
			href.startsWith('/') &&
			!href.startsWith('//') &&
			!href.startsWith(`${base}/`)
		) {
			node.properties = { ...node.properties, href: `${base}${href}` };
		}
	}
	(node.children ?? []).forEach((child) => {
		prefixInternalLinks(child, base);
	});
}

export function rehypeInternalLinks(base: string) {
	return (tree: HastNode) => {
		prefixInternalLinks(tree, base);
	};
}
