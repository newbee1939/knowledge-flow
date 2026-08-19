import { describe, expect, it } from 'vitest';
import type { HastNode } from './rehypeExternalLinks';
import { prefixInternalLinks } from './rehypeInternalLinks';

const BASE = '/knowledge-flow';

function link(href: string): HastNode {
	return { type: 'element', tagName: 'a', properties: { href } };
}

describe('prefixInternalLinks', () => {
	it('サイト内の絶対パスに base を付ける', () => {
		const tree = link('/blog/2026-08-19/#windows-oem');
		prefixInternalLinks(tree, BASE);
		expect(tree.properties?.href).toBe('/knowledge-flow/blog/2026-08-19/#windows-oem');
	});

	it('外部リンクには何もしない', () => {
		const tree = link('https://example.com/article');
		prefixInternalLinks(tree, BASE);
		expect(tree.properties?.href).toBe('https://example.com/article');
	});

	it('スキーム省略の外部リンク（//）には何もしない', () => {
		const tree = link('//example.com/article');
		prefixInternalLinks(tree, BASE);
		expect(tree.properties?.href).toBe('//example.com/article');
	});

	it('すでに base が付いているリンクには二重に付けない', () => {
		const tree = link('/knowledge-flow/blog/2026-08-19/');
		prefixInternalLinks(tree, BASE);
		expect(tree.properties?.href).toBe('/knowledge-flow/blog/2026-08-19/');
	});

	it('ネストした子要素も再帰的に処理する', () => {
		const tree: HastNode = {
			type: 'root',
			children: [{ type: 'element', tagName: 'p', children: [link('/categories/llm/')] }],
		};
		prefixInternalLinks(tree, BASE);
		expect(tree.children?.[0]?.children?.[0]?.properties?.href).toBe(
			'/knowledge-flow/categories/llm/',
		);
	});
});
