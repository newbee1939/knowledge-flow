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
	it('記事をカテゴリ別に集約し、記事数の多い順 → 名前順で返す', () => {
		const categories = collectCategories([
			article({ title: 'a', categories: ['Backend', 'TypeScript'] }),
			article({ title: 'b', categories: ['Backend', 'AWS'] }),
			article({ title: 'c', categories: ['AWS'] }),
		]);

		expect(categories.map((c) => c.name)).toEqual(['AWS', 'Backend', 'TypeScript']);
		expect(categories[0].articles.map((a) => a.title)).toEqual(['b', 'c']);
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
