import { describe, expect, it } from 'vitest';
import { extractArticles } from './articles';

const post = (body: string) => ({
	postId: '2026-07-18',
	date: new Date('2026-07-18'),
	body,
});

describe('extractArticles', () => {
	it('H2 ジャンル配下の H3 リンク見出しを記事として抽出する', () => {
		const articles = extractArticles(
			post(
				[
					'## AI',
					'',
					'### [Agent Patterns](https://example.com/a)',
					'',
					'本文。',
					'',
					'## Backend',
					'',
					'### [HTTP QUERY](https://example.com/b)',
					'',
					'本文。',
				].join('\n'),
			),
		);

		expect(articles).toHaveLength(2);
		expect(articles[0]).toMatchObject({
			postId: '2026-07-18',
			genre: 'AI',
			title: 'Agent Patterns',
			url: 'https://example.com/a',
			anchor: 'agent-patterns',
			categories: ['AI'],
		});
		expect(articles[1]).toMatchObject({ genre: 'Backend', categories: ['Backend'] });
	});

	it('見出し直後の categories コメントをジャンルに加えて読む（重複は除去）', () => {
		const articles = extractArticles(
			post(
				[
					'## Backend',
					'',
					'### [TS 7.0](https://example.com/a)',
					'<!-- categories: TypeScript, Go, Backend -->',
					'',
					'本文。',
				].join('\n'),
			),
		);

		expect(articles[0].categories).toEqual(['Backend', 'TypeScript', 'Go']);
	});

	it('anchor は Astro と同じく全見出しを文書順に slug 化する（重複は -1 連番）', () => {
		const articles = extractArticles(
			post(
				[
					'## AI',
					'',
					'### [Same Title](https://example.com/a)',
					'',
					'## Infra',
					'',
					'### [Same Title](https://example.com/b)',
					'',
					'### [AI](https://example.com/c)',
				].join('\n'),
			),
		);

		expect(articles.map((a) => a.anchor)).toEqual(['same-title', 'same-title-1', 'ai-1']);
	});

	it('コードフェンス内の ## や <!-- --> は無視する', () => {
		const articles = extractArticles(
			post(
				[
					'## AI',
					'',
					'### [Mermaid 入り](https://example.com/a)',
					'',
					'```mermaid',
					'flowchart LR',
					'    A[## 偽見出し] --> B[X]',
					'<!-- categories: Fake -->',
					'```',
					'',
					'### [次の記事](https://example.com/b)',
				].join('\n'),
			),
		);

		expect(articles).toHaveLength(2);
		expect(articles[0].categories).toEqual(['AI']);
	});

	it('categories コメントは直前の記事にだけ効く（記事の外では無視）', () => {
		const articles = extractArticles(
			post(
				[
					'<!-- categories: Orphan -->',
					'',
					'## AI',
					'<!-- categories: AlsoOrphan -->',
					'',
					'### [記事](https://example.com/a)',
					'',
					'本文。',
				].join('\n'),
			),
		);

		expect(articles).toHaveLength(1);
		expect(articles[0].categories).toEqual(['AI']);
	});

	it('categories コメントは見出し直後のみ有効（本文開始後は無視、空行は挟んでよい）', () => {
		const articles = extractArticles(
			post(
				[
					'## AI',
					'',
					'### [本文中にコメント](https://example.com/a)',
					'',
					'本文が始まった。',
					'<!-- categories: TooLate -->',
					'',
					'### [空行を挟んだコメント](https://example.com/b)',
					'',
					'<!-- categories: StillOk -->',
					'',
					'本文。',
				].join('\n'),
			),
		);

		expect(articles[0].categories).toEqual(['AI']);
		expect(articles[1].categories).toEqual(['AI', 'StillOk']);
	});

	it('リンクでない H3 は記事として扱わないが、slug の連番は消費する', () => {
		const articles = extractArticles(
			post(
				['## AI', '', '### ただの見出し', '', '### [ただの見出し](https://example.com/a)'].join(
					'\n',
				),
			),
		);

		expect(articles).toHaveLength(1);
		expect(articles[0].anchor).toBe('ただの見出し-1');
	});
});
