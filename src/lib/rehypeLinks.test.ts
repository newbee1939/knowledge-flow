import { describe, expect, it } from 'vitest';
import { type HastNode, transformLinks } from './rehypeLinks';

function link(href: string, properties: Record<string, unknown> = {}): HastNode {
	return { type: 'element', tagName: 'a', properties: { href, ...properties } };
}

describe('transformLinks', () => {
	it('http/https リンクに target と rel を付与する', () => {
		const tree = link('https://example.com/article');
		transformLinks(tree, '/knowledge-flow');
		expect(tree.properties?.target).toBe('_blank');
		expect(tree.properties?.rel).toBe('noopener noreferrer');
	});

	it('サイト内リンクは base を前に付け、同じタブのままにする', () => {
		const tree = link('/blog/2026-07-17/#foo');
		transformLinks(tree, '/knowledge-flow');
		expect(tree.properties?.href).toBe('/knowledge-flow/blog/2026-07-17/#foo');
		expect(tree.properties?.target).toBeUndefined();
	});

	it('mailto など http 以外のスキームには何もしない', () => {
		const tree = link('mailto:test@example.com');
		transformLinks(tree, '/knowledge-flow');
		expect(tree.properties?.href).toBe('mailto:test@example.com');
		expect(tree.properties?.target).toBeUndefined();
	});

	it('ネストした子要素も再帰的に処理する', () => {
		const tree: HastNode = {
			type: 'root',
			children: [{ type: 'element', tagName: 'p', children: [link('https://example.com')] }],
		};
		transformLinks(tree, '/knowledge-flow');
		const nestedLink = tree.children?.[0]?.children?.[0];
		expect(nestedLink?.properties?.target).toBe('_blank');
	});

	it('既存の properties（class など）を保持する', () => {
		const tree = link('https://example.com', { class: 'foo' });
		transformLinks(tree, '/knowledge-flow');
		expect(tree.properties?.class).toBe('foo');
		expect(tree.properties?.target).toBe('_blank');
	});
});
