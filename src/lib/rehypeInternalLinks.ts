import type { HastNode } from './rehypeExternalLinks';

/**
 * 記事本文のサイト内リンク（`/blog/2026-08-19/#…` のような絶対パス）の先頭に base を付ける。
 *
 * 本番は https://newbee1939.github.io/knowledge-flow/ 配下に公開されるため、base が付かない
 * リンクは本番だけ 404 になる。Astro は markdown 本文中のリンクを書き換えないので、ここで付ける。
 * 記事側に base を書かせない（`/blog/…` とだけ書けばよい）ことで、公開先が変わっても
 * 過去記事を一括置換せずに済む。
 */
export function prefixInternalLinks(node: HastNode, base: string): void {
	if (node.type === 'element' && node.tagName === 'a') {
		const href = node.properties?.href;
		// `//example.com` はスキーム省略の外部リンクなので対象外。
		// 既に base が付いているものは二重に付けない。
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
