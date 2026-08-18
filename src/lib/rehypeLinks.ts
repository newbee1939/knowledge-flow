import { withBase } from './url';

export interface HastNode {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
}

/**
 * 記事本文のリンクを 2 通りに直す。
 *
 * - 外部リンク（http/https）: target="_blank" と rel="noopener noreferrer" を付ける。
 *   rel="noopener" が無いと、新しいタブ側の window.opener 経由で元のタブを別サイトへ
 *   誘導できてしまう（reverse tabnabbing）ため必須
 * - サイト内リンク（`/blog/...` のような絶対パス）: base を前に付ける。同じタブのまま。
 *   docs/ はデータ層で、GitHub Pages のどこに置かれるか（`/knowledge-flow`）を知らない。
 *   base をここで足すので、レポートの markdown には `/blog/<日付>/#<見出し>` とだけ書けばよい
 */
export function transformLinks(node: HastNode, base: string): void {
	if (node.type === 'element' && node.tagName === 'a') {
		const href = node.properties?.href;
		if (typeof href === 'string' && /^https?:\/\//.test(href)) {
			node.properties = {
				...node.properties,
				target: '_blank',
				rel: 'noopener noreferrer',
			};
		} else if (typeof href === 'string' && href.startsWith('/')) {
			node.properties = { ...node.properties, href: withBase(href, base) };
		}
	}
	(node.children ?? []).forEach((child) => {
		transformLinks(child, base);
	});
}

export function rehypeLinks({ base }: { base: string }) {
	return (tree: HastNode) => {
		transformLinks(tree, base);
	};
}
