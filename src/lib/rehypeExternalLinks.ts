export interface HastNode {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
}

/**
 * 記事本文の外部リンク（http/https）に target="_blank" と
 * rel="noopener noreferrer" を付与する。
 *
 * rel="noopener" が無いと、新しいタブ側の window.opener 経由で
 * 元のタブを別サイトへ誘導できてしまう（reverse tabnabbing）ため必須。
 * サイト内リンク（相対パス）は対象外＝同じタブのまま。
 */
export function addExternalLinkAttributes(node: HastNode): void {
	if (node.type === 'element' && node.tagName === 'a') {
		const href = node.properties?.href;
		if (typeof href === 'string' && /^https?:\/\//.test(href)) {
			node.properties = {
				...node.properties,
				target: '_blank',
				rel: 'noopener noreferrer',
			};
		}
	}
	(node.children ?? []).forEach(addExternalLinkAttributes);
}

export function rehypeExternalLinks() {
	return (tree: HastNode) => {
		addExternalLinkAttributes(tree);
	};
}
