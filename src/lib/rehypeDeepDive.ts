import type { HastNode } from './rehypeExternalLinks';

const EXTERNAL_URL = /^https?:\/\//;

const element = (
	tagName: string,
	properties: Record<string, unknown>,
	children: HastNode[] = [],
): HastNode => ({ type: 'element', tagName, properties, children });

/**
 * 日次レポートの `### [記事タイトル](元記事URL)` だけを拾い、その URL を返す。
 *
 * 条件を「子がちょうど 1 つの外部リンク」に絞ってあるので、見出しに文字が併記された
 * もの、h2（ジャンル名）、サイト内リンクの見出しは自然に外れる。まとめ記事
 * （docs/blog/periods/）と Tips は h2 中心でリンク見出しを持たないため、
 * ページ種別で分岐しなくてもボタンは出ない。
 */
const articleUrl = (node: HastNode): string | undefined => {
	if (node.tagName !== 'h3' || node.children?.length !== 1) {
		return undefined;
	}
	const child = node.children[0];
	const href = child.tagName === 'a' ? child.properties?.href : undefined;
	return typeof href === 'string' && EXTERNAL_URL.test(href) ? href : undefined;
};

/**
 * 記事 1 本ぶんの「AI深掘り」。開閉は details 任せで、クライアント JS を使わない。
 * コピーだけは JS が必要なので、文面を data 属性に持たせて Prose.astro の
 * スクリプトから読ませる。
 */
const deepDiveNode = (url: string): HastNode => {
	// 記事の中身は AI 側に読ませるので、渡すのは URL だけでよい
	const prompt = `以下の記事について、分かりやすく解説をお願いします。\n\n${url}`;
	return element('details', { class: 'deepdive' }, [
		// アイコンは CSS の summary::before で描く（装飾なので HTML には出さない）。
		// 読み上げ用の名前は aria-label、PC のツールチップは title で補う。
		element('summary', { 'aria-label': 'AI深掘り', title: 'AI深掘り' }),
		element('div', { class: 'deepdive-menu' }, [
			element('button', { type: 'button', 'data-deepdive-copy': prompt }, [
				{ type: 'text', value: '深掘り文をコピー' },
			]),
			// ChatGPT はクエリ q の文字列を入力欄へ流し込み、そのまま送信する。
			// Gemini は URL でのプレフィルが公式仕様ではないため、コピーで代替する。
			element(
				'a',
				{
					href: `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
					target: '_blank',
					rel: 'noopener noreferrer',
				},
				[{ type: 'text', value: 'ChatGPTで深掘り' }],
			),
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
