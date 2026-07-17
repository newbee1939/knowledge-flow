import { describe, expect, it } from 'vitest';
import { addExternalLinkAttributes, type HastNode } from './rehypeExternalLinks';

function link(href: string, properties: Record<string, unknown> = {}): HastNode {
	return { type: 'element', tagName: 'a', properties: { href, ...properties } };
}

describe('addExternalLinkAttributes', () => {
	it('http/https リンクに target と rel を付与する', () => {
		const tree = link('https://example.com/article');
		addExternalLinkAttributes(tree);
		expect(tree.properties?.target).toBe('_blank');
		expect(tree.properties?.rel).toBe('noopener noreferrer');
	});

	it('サイト内の相対リンクには何もしない', () => {
		const tree = link('/knowledge-flow/blog/2026-07-17/');
		addExternalLinkAttributes(tree);
		expect(tree.properties?.target).toBeUndefined();
	});

	it('mailto など http 以外のスキームには何もしない', () => {
		const tree = link('mailto:test@example.com');
		addExternalLinkAttributes(tree);
		expect(tree.properties?.target).toBeUndefined();
	});

	it('ネストした子要素も再帰的に処理する', () => {
		const tree: HastNode = {
			type: 'root',
			children: [{ type: 'element', tagName: 'p', children: [link('https://example.com')] }],
		};
		addExternalLinkAttributes(tree);
		const nestedLink = tree.children?.[0]?.children?.[0];
		expect(nestedLink?.properties?.target).toBe('_blank');
	});

	it('既存の properties（class など）を保持する', () => {
		const tree = link('https://example.com', { class: 'foo' });
		addExternalLinkAttributes(tree);
		expect(tree.properties?.class).toBe('foo');
		expect(tree.properties?.target).toBe('_blank');
	});
});
