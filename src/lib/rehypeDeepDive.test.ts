import { describe, expect, it } from 'vitest';
import { insertDeepDive } from './rehypeDeepDive';
import type { HastNode } from './rehypeExternalLinks';

const text = (value: string): HastNode => ({ type: 'text', value });

const link = (href: string): HastNode => ({
	type: 'element',
	tagName: 'a',
	properties: { href },
	children: [text('記事タイトル')],
});

const heading = (tagName: string, children: HastNode[]): HastNode => ({
	type: 'element',
	tagName,
	properties: {},
	children,
});

const root = (children: HastNode[]): HastNode => ({ type: 'root', children });

const findDeepDives = (node: HastNode): HastNode[] => [
	...(node.tagName === 'details' ? [node] : []),
	...(node.children ?? []).flatMap(findDeepDives),
];

const findByTag = (node: HastNode, tagName: string): HastNode | undefined =>
	node.tagName === tagName
		? node
		: (node.children ?? []).reduce<HastNode | undefined>(
				(found, child) => found ?? findByTag(child, tagName),
				undefined,
			);

describe('insertDeepDive', () => {
	it('記事見出しの直後に details を挿入する', () => {
		const tree = root([
			heading('h3', [link('https://example.com/article')]),
			{ type: 'element', tagName: 'p', children: [text('本文')] },
		]);
		insertDeepDive(tree);
		expect(tree.children?.map((child) => child.tagName)).toEqual(['h3', 'details', 'p']);
	});

	it('コピー用の文面と ChatGPT の URL を持つ', () => {
		const tree = root([heading('h3', [link('https://example.com/article')])]);
		insertDeepDive(tree);
		const [deepDive] = findDeepDives(tree);

		const prompt =
			'以下の記事について、分かりやすく簡潔に解説をお願いします。\n\nhttps://example.com/article';
		expect(findByTag(deepDive, 'button')?.properties?.['data-deepdive-copy']).toBe(prompt);
		expect(findByTag(deepDive, 'a')?.properties?.href).toBe(
			`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
		);
	});

	it('Claude の URL も持ち、別タブで開く', () => {
		const tree = root([heading('h3', [link('https://example.com/article')])]);
		insertDeepDive(tree);
		const [deepDive] = findDeepDives(tree);

		const prompt =
			'以下の記事について、分かりやすく簡潔に解説をお願いします。\n\nhttps://example.com/article';
		const links = findByTag(deepDive, 'div')?.children?.filter((node) => node.tagName === 'a');
		expect(links?.at(-1)?.properties).toEqual({
			href: `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
			target: '_blank',
			rel: 'noopener noreferrer',
		});
	});

	it('読み上げ用の名前を summary に付ける', () => {
		const tree = root([heading('h3', [link('https://example.com/article')])]);
		insertDeepDive(tree);
		const [deepDive] = findDeepDives(tree);
		expect(findByTag(deepDive, 'summary')?.properties?.['aria-label']).toBe('AI深掘り');
	});

	it('リンクのない見出しには挿入しない', () => {
		const tree = root([heading('h3', [text('ただの見出し')])]);
		insertDeepDive(tree);
		expect(findDeepDives(tree)).toHaveLength(0);
	});

	it('サイト内リンクの見出しには挿入しない', () => {
		const tree = root([heading('h3', [link('/blog/2026-09-19/')])]);
		insertDeepDive(tree);
		expect(findDeepDives(tree)).toHaveLength(0);
	});

	it('h2（ジャンル名）には挿入しない', () => {
		const tree = root([heading('h2', [link('https://example.com/article')])]);
		insertDeepDive(tree);
		expect(findDeepDives(tree)).toHaveLength(0);
	});

	it('リンクに文字が併記された見出しには挿入しない', () => {
		const tree = root([heading('h3', [link('https://example.com/article'), text(' 補足')])]);
		insertDeepDive(tree);
		expect(findDeepDives(tree)).toHaveLength(0);
	});

	it('記事が複数あればそれぞれの直後に 1 つずつ挿入する', () => {
		const tree = root([
			heading('h2', [text('AI')]),
			heading('h3', [link('https://example.com/one')]),
			heading('h3', [link('https://example.com/two')]),
		]);
		insertDeepDive(tree);
		expect(tree.children?.map((child) => child.tagName)).toEqual([
			'h2',
			'h3',
			'details',
			'h3',
			'details',
		]);
	});
});
