import { describe, expect, it } from 'vitest';
import { withBase } from './url';

// このテストが守っているもの:
// BASE_URL の末尾スラッシュの有無は astro.config の trailingSlash 設定に左右される。
// 手で連結すると、設定を変えた瞬間にリンクが `//` になるか、逆に繋がってしまう。
// PR #4 で実際にレビュアーが誤認した箇所なので、両方の形で固定しておく。
describe('withBase', () => {
	it('base に末尾スラッシュが無くても正しく繋ぐ', () => {
		expect(withBase('favicon.svg', '/knowledge-flow')).toBe('/knowledge-flow/favicon.svg');
	});

	it('base に末尾スラッシュがあってもダブルスラッシュにしない', () => {
		expect(withBase('favicon.svg', '/knowledge-flow/')).toBe('/knowledge-flow/favicon.svg');
	});

	it('path の先頭スラッシュを重複させない', () => {
		expect(withBase('/blog/2026-07-14/', '/knowledge-flow/')).toBe(
			'/knowledge-flow/blog/2026-07-14/',
		);
	});

	it('base がルート（/）でも壊れない', () => {
		expect(withBase('blog/2026-07-14/', '/')).toBe('/blog/2026-07-14/');
	});

	it('末尾のスラッシュを保つ（Astro のディレクトリ形式の URL）', () => {
		expect(withBase('blog/2026-07-14/', '/knowledge-flow')).toBe(
			'/knowledge-flow/blog/2026-07-14/',
		);
	});
});
