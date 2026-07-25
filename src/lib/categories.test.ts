import { describe, expect, it } from 'vitest';
import type { PostArticle } from './articles';
import { collectCategories } from './categories';

const article = (overrides: Partial<PostArticle>): PostArticle => ({
	postId: '2026-07-18',
	date: new Date('2026-07-18'),
	genre: 'Backend',
	title: 'title',
	url: 'https://example.com',
	anchor: 'title',
	categories: ['Backend'],
	...overrides,
});

describe('collectCategories', () => {
	it('記事をカテゴリ別に集約し、記事数によらず名前順（アルファベット順）で返す', () => {
		const categories = collectCategories([
			article({ title: 'a', categories: ['Zebra', 'TypeScript'] }),
			article({ title: 'b', categories: ['Zebra', 'AWS'] }),
			article({ title: 'c', categories: ['Zebra'] }),
		]);

		// Zebra は 3 記事で最多だが、記事数順ではなく名前順なので末尾に並ぶ
		expect(categories.map((c) => c.name)).toEqual(['AWS', 'TypeScript', 'Zebra']);
		expect(categories.find((c) => c.name === 'Zebra')?.articles.map((a) => a.title)).toEqual([
			'a',
			'b',
			'c',
		]);
	});

	it('カテゴリ内の記事は入力順を保つ（新しい順で渡せば新しい順のまま）', () => {
		const categories = collectCategories([
			article({ title: 'newest', date: new Date('2026-07-18'), categories: ['AWS'] }),
			article({ title: 'older', date: new Date('2026-07-17'), categories: ['AWS'] }),
		]);

		expect(categories[0].articles.map((a) => a.title)).toEqual(['newest', 'older']);
	});

	it('URL 用の slug を採番する（小文字化・スペースはハイフン）', () => {
		const categories = collectCategories([
			article({ categories: ['GitHub Actions'] }),
			article({ categories: ['TypeScript'] }),
		]);

		expect(categories.find((c) => c.name === 'GitHub Actions')?.slug).toBe('github-actions');
		expect(categories.find((c) => c.name === 'TypeScript')?.slug).toBe('typescript');
	});
});
