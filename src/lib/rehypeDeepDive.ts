import type { HastNode } from './rehypeExternalLinks';

const EXTERNAL_URL = /^https?:\/\//;

const element = (
	tagName: string,
	properties: Record<string, unknown>,
	children: HastNode[] = [],
): HastNode => ({ type: 'element', tagName, properties, children });

/**
 * 日次レポートの `### [記事タイトル](元記事URL)` だけを拾う。「子がちょうど 1 つの外部リンク」
 * という条件なので、h2 中心でリンク見出しを持たないまとめ記事と Tips には出ない。
 */
const articleUrl = (node: HastNode): string | undefined => {
	if (node.tagName !== 'h3' || node.children?.length !== 1) {
		return undefined;
	}
	const child = node.children[0];
	const href = child.tagName === 'a' ? child.properties?.href : undefined;
	return typeof href === 'string' && EXTERNAL_URL.test(href) ? href : undefined;
};

const externalLink = (href: string, label: string): HastNode =>
	element('a', { href, target: '_blank', rel: 'noopener noreferrer' }, [
		{ type: 'text', value: label },
	]);

/** 記事 1 本ぶんの「AI深掘り」。コピー用の文面は data 属性で Prose.astro のスクリプトに渡す */
const deepDiveNode = (url: string): HastNode => {
	const prompt = `以下の記事について、分かりやすく簡潔に解説をお願いします。\n\n${url}`;
	const query = encodeURIComponent(prompt);
	return element('details', { class: 'deepdive' }, [
		// アイコンは CSS の summary::before で描くので中身は空
		element('summary', { 'aria-label': 'AI深掘り', title: 'AI深掘り' }),
		element('div', { class: 'deepdive-menu' }, [
			element('button', { type: 'button', 'data-deepdive-copy': prompt }, [
				{ type: 'text', value: '深掘り文をコピー' },
			]),
			// Gemini は URL でのプレフィルが公式仕様ではないため、コピーで代替する
			externalLink(`https://chatgpt.com/?q=${query}`, 'ChatGPTで深掘り'),
			externalLink(`https://claude.ai/new?q=${query}`, 'Claudeで深掘り'),
		]),
	]);
};

export function insertDeepDive(node: HastNode): void {
	node.children = (node.children ?? []).flatMap((child) => {
		insertDeepDive(child);
		const url = articleUrl(child);
		return url ? [child, deepDiveNode(url)] : [child];
	});
}

export function rehypeDeepDive() {
	return (tree: HastNode) => {
		insertDeepDive(tree);
	};
}
