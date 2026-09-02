import { beforeEach, describe, expect, it, vi } from 'vitest';

// astro:content は Astro のビルド時に生成される仮想モジュールなので、テストでは差し替える。
const getCollection = vi.fn();
vi.mock('astro:content', () => ({ getCollection: (name: string) => getCollection(name) }));

const { getPosts, getArticles, getTips } = await import('./posts');

const post = (date: string) => ({ id: date, data: { date: new Date(date), title: date } });

/** 記事 1 本ぶんの本文を組み立てる（`## ジャンル` + `### [タイトル](URL)`） */
const body = (...articles: { title: string; url: string }[]) =>
	['## AI', ...articles.map(({ title, url }) => `### [${title}](${url})`)].join('\n\n');

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

describe('getArticles', () => {
	beforeEach(() => getCollection.mockReset());

	it('全レポートの記事を新しい順に返す', async () => {
		getCollection.mockReturnValue([
			{ ...post('2026-07-13'), body: body({ title: '古い', url: 'https://example.com/a' }) },
			{ ...post('2026-07-14'), body: body({ title: '新しい', url: 'https://example.com/b' }) },
		]);

		const articles = await getArticles();
		expect(articles.map((a) => a.title)).toEqual(['新しい', '古い']);
	});

	// 本命。別記事の URL が紛れ込んでもリンク先は 200 を返すため、リンク切れ検査では
	// 捕まえられない。人力で気づける規模でもないので、ビルドで落とすしかない。
	it('別々の日の記事が同じ URL を指しているとビルドを止める', async () => {
		getCollection.mockReturnValue([
			{ ...post('2026-07-13'), body: body({ title: 'Gemma 4 が高速化', url: 'https://ex.com/x' }) },
			{
				...post('2026-07-14'),
				body: body({ title: 'Windows 11 の不具合', url: 'https://ex.com/x' }),
			},
		]);

		const error = await getArticles().catch((e: Error) => e);
		expect(error).toMatchObject({
			message: expect.stringContaining('同じ URL が複数の記事に付いています（1 件）'),
		});
		// どれを直せばいいか分かるよう、URL と該当記事を列挙する
		expect((error as Error).message).toContain('2026-07-13: Gemma 4 が高速化');
		expect((error as Error).message).toContain('2026-07-14: Windows 11 の不具合');
	});

	it('同じレポート内で URL が重複していてもビルドを止める', async () => {
		getCollection.mockReturnValue([
			{
				...post('2026-07-13'),
				body: body(
					{ title: 'Gemma 4 が高速化', url: 'https://ex.com/x' },
					{ title: 'Windows 11 の不具合', url: 'https://ex.com/x' },
				),
			},
		]);

		await expect(getArticles()).rejects.toThrow('同じ URL が複数の記事に付いています（1 件）');
	});

	it('URL が重複していなければ通る', async () => {
		getCollection.mockReturnValue([
			{
				...post('2026-07-13'),
				body: body(
					{ title: 'a', url: 'https://ex.com/a' },
					{ title: 'b', url: 'https://ex.com/b' },
				),
			},
		]);

		await expect(getArticles()).resolves.toHaveLength(2);
	});
});

describe('getTips', () => {
	const tip = (id: string, updated: string) => ({
		id,
		data: { title: id, description: '', updated: new Date(updated) },
	});

	const postWithBody = (date: string, body = '') => ({ ...post(date), body });

	/** コレクション名で返り値を出し分ける（getTips は tips と posts の両方を読む） */
	const mockCollections = (
		tips: ReturnType<typeof tip>[],
		posts: ReturnType<typeof postWithBody>[] = [postWithBody('2026-09-02')],
	) => getCollection.mockImplementation((name: string) => (name === 'tips' ? tips : posts));

	beforeEach(() => getCollection.mockReset());

	it('更新日の新しい順に並べる', async () => {
		mockCollections([tip('mcp', '2026-08-01'), tip('openrouter', '2026-09-01')]);
		const tips = await getTips();
		expect(tips.map((t) => t.id)).toEqual(['openrouter', 'mcp']);
	});

	// id はそのまま URL と記事からの参照キーになる。日本語や大文字が混じると
	// エンコードの差でリンク切れを踏む。
	it('id が slug でなければビルドを止める', async () => {
		mockCollections([tip('OpenRouter', '2026-09-01')]);
		await expect(getTips()).rejects.toThrow('Tips OpenRouter のファイル名が slug になっていません');
	});

	// リンク切れは 404 になるだけで、ビルドも HTTP も静かに通る。
	it('存在しない Tips へリンクしている記事があればビルドを止める', async () => {
		mockCollections(
			[tip('mcp', '2026-09-01')],
			[postWithBody('2026-09-02', '[OpenRouter](/tips/openrouter/)')],
		);
		await expect(getTips()).rejects.toThrow('2026-09-02 → /tips/openrouter/');
	});
});
