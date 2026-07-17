import { beforeEach, describe, expect, it, vi } from 'vitest';

// astro:content は Astro のビルド時に生成される仮想モジュールなので、テストでは差し替える。
const getCollection = vi.fn();
vi.mock('astro:content', () => ({ getCollection: () => getCollection() }));

const { getPosts } = await import('./posts');

const post = (date: string) => ({ id: date, data: { date: new Date(date), title: date } });

describe('getPosts', () => {
	beforeEach(() => getCollection.mockReset());

	// これが本命。Astro はコレクションが空でも警告だけでビルドを通し、記事ゼロのページを出力する。
	// 毎朝の自動更新で docs/ のパスがずれたら、空のサイトが静かに公開されてしまう。
	it('0 件ならビルドを止める（空のサイトを公開しない）', async () => {
		getCollection.mockReturnValue([]);
		await expect(getPosts()).rejects.toThrow('posts が 0 件です');
	});

	it('日付の新しい順に並べる', async () => {
		getCollection.mockReturnValue([post('2026-07-12'), post('2026-07-14'), post('2026-07-13')]);
		const posts = await getPosts();
		expect(posts.map((p) => p.id)).toEqual(['2026-07-14', '2026-07-13', '2026-07-12']);
	});

	it('1 件でも通る', async () => {
		getCollection.mockReturnValue([post('2026-07-14')]);
		await expect(getPosts()).resolves.toHaveLength(1);
	});

	// post.id（ファイル名）と frontmatter date は運用上一致する想定でしかなく、スキーマは
	// 検証しない。ずれると一覧・詳細ページで違う日付が出るため、ビルド時に検知する。
	it('post.id と frontmatter date が食い違うとビルドを止める', async () => {
		getCollection.mockReturnValue([
			{ id: '2026-07-14', data: { date: new Date('2026-07-15'), title: 't' } },
		]);
		await expect(getPosts()).rejects.toThrow(
			'2026-07-14 のファイル名と frontmatter date（2026-07-15）が一致しません',
		);
	});
});
