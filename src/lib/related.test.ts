import { describe, expect, it } from 'vitest';
import type { PostArticle } from './articles';
import { collectRelated } from './related';

const article = (overrides: Partial<PostArticle>): PostArticle => ({
	postId: '2026-07-18',
	date: new Date('2026-07-18'),
	genre: 'AI',
	title: 'title',
	url: 'https://example.com',
	anchor: 'title',
	categories: ['AI'],
	...overrides,
});

const past = (overrides: Partial<PostArticle>): PostArticle =>
	article({ postId: '2026-07-01', date: new Date('2026-07-01'), ...overrides });

describe('collectRelated', () => {
	it('カテゴリを共有する過去の記事を、一致の強い順に返す', () => {
		const groups = collectRelated(
			[
				article({ title: 'today', categories: ['AI', 'Qwen', 'LLM'] }),
				past({ title: 'one', categories: ['AI', 'LLM'] }),
				past({ title: 'two', categories: ['AI', 'Qwen', 'LLM'] }),
			],
			'2026-07-18',
		);

		expect(groups.map((group) => group.related.map((a) => a.title))).toEqual([['two', 'one']]);
	});

	it('よく出るカテゴリでの一致より、珍しいカテゴリでの一致を優先する', () => {
		const groups = collectRelated(
			[
				article({ title: 'today', categories: ['AI', 'LLM', 'Qwen'] }),
				past({ title: 'rare', categories: ['AI', 'Qwen'] }),
				// LLM は他に 3 件あり、一致しても「同じジャンル」以上の意味を持たない
				past({ title: 'common', categories: ['AI', 'LLM'] }),
				past({ categories: ['AI', 'LLM'] }),
				past({ categories: ['AI', 'LLM'] }),
			],
			'2026-07-18',
			1,
		);

		expect(groups[0].related.map((a) => a.title)).toEqual(['rare']);
	});

	it('ジャンルだけの一致は関連にしない', () => {
		// AI は全 AI 記事に付くので、これを関連の根拠にすると全記事が互いに関連してしまう
		const groups = collectRelated(
			[article({ categories: ['AI'] }), past({ categories: ['AI'] })],
			'2026-07-18',
		);

		expect(groups).toEqual([]);
	});

	it('その日より後の記事は関連にしない', () => {
		const groups = collectRelated(
			[
				article({ postId: '2026-08-01', date: new Date('2026-08-01'), categories: ['AI', 'Qwen'] }),
				article({ categories: ['AI', 'Qwen'] }),
			],
			'2026-07-18',
		);

		expect(groups).toEqual([]);
	});

	it('limit を超える関連は切り捨てる', () => {
		const groups = collectRelated(
			[
				article({ categories: ['AI', 'Qwen'] }),
				past({ title: 'one', categories: ['AI', 'Qwen'] }),
				past({ title: 'two', categories: ['AI', 'Qwen'] }),
				past({ title: 'three', categories: ['AI', 'Qwen'] }),
			],
			'2026-07-18',
			2,
		);

		expect(groups[0].related.map((a) => a.title)).toEqual(['one', 'two']);
	});
});
