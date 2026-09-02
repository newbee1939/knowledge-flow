import { describe, expect, it } from 'vitest';
import { findBrokenTipLinks } from './tips';

const post = (body: string) => [{ id: '2026-09-02', body }];

describe('findBrokenTipLinks', () => {
	it('存在する Tips へのリンクは通す', () => {
		expect(
			findBrokenTipLinks(post('[OpenRouter とは](/tips/openrouter/)'), ['openrouter']),
		).toEqual([]);
	});

	it('存在しない Tips へのリンクを返す', () => {
		expect(findBrokenTipLinks(post('[廃止](/tips/openrouter/)'), ['mcp'])).toEqual([
			{ postId: '2026-09-02', slug: 'openrouter' },
		]);
	});

	// 記事側は `/tips/openrouter`・`/tips/openrouter/#見出し` とも書きうる。
	// 拾い漏らすとリンク切れが検査をすり抜ける。
	it('末尾スラッシュや #見出し が付いていても slug を取る', () => {
		const body = '[a](/tips/openrouter) [b](/tips/openrouter/#料金)';
		expect(findBrokenTipLinks([{ id: 'p', body }], [])).toEqual([
			{ postId: 'p', slug: 'openrouter' },
			{ postId: 'p', slug: 'openrouter' },
		]);
	});

	it('Tips 以外のサイト内リンク・外部リンクは見ない', () => {
		const body =
			'[過去記事](/blog/2026-08-18/#見出し) [外部](https://example.com/tips/openrouter/)';
		expect(findBrokenTipLinks([{ id: 'p', body }], [])).toEqual([]);
	});

	it('複数のレポートを横断して拾う', () => {
		const posts = [
			{ id: '2026-09-01', body: '[a](/tips/mcp/)' },
			{ id: '2026-09-02', body: '[b](/tips/openrouter/)' },
		];
		expect(findBrokenTipLinks(posts, ['mcp'])).toEqual([
			{ postId: '2026-09-02', slug: 'openrouter' },
		]);
	});
});
