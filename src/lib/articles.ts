import GithubSlugger from 'github-slugger';

/** 日次レポート内の 1 記事（H3 見出し 1 つ分）。 */
export interface PostArticle {
	/** 記事が属する post のファイル名由来 ID（例: "2026-07-18"） */
	postId: string;
	date: Date;
	/** H2 見出しのジャンル（AI / Infra / Backend / Frontend / Others） */
	genre: string;
	title: string;
	/** 元記事の URL */
	url: string;
	/** 日次レポートページ内の見出しアンカー（`/blog/<postId>/#<anchor>` で記事へ飛べる） */
	anchor: string;
	/** ジャンル＋明示カテゴリ（重複除去済み）。明示カテゴリは見出し直後の categories コメントで付与する */
	categories: string[];
}

const FENCE = /^\s*(?:```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*?)\s*$/;
const LINK_HEADING = /^\[(.+)\]\((\S+)\)$/;
const CATEGORIES_COMMENT = /^<!--\s*categories:\s*(.*?)\s*-->$/;

/** markdown のインラインリンク `[text](url)` を text に落とし、見出しの表示テキストへ寄せる */
const toTextContent = (rawHeading: string): string =>
	rawHeading.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

/**
 * 日次レポートの本文（raw markdown）から記事一覧を抽出する。
 *
 * - `## <ジャンル>` 配下の `### [タイトル](URL)` を 1 記事として拾う
 * - 見出し直後（空行のみ挟んでよい）の `<!-- categories: A, B -->` コメントをカテゴリとして読む
 *   （無ければジャンルのみ）。本文が始まった後のコメントは誤爆防止のため無視する
 * - `anchor` は Astro の見出し ID 生成（@astrojs/markdown-remark の rehypeHeadingIds）と同じく、
 *   **すべての見出しを文書順に** github-slugger へ通して算出する。H2 も消費しないと
 *   重複見出しの連番（`-1` サフィックス）がズレるので、記事以外の見出しもスキップしない
 * - コードフェンス内（Mermaid 図など）の `##` や `<!-- -->` は見出し・コメントとして扱わない
 */
export function extractArticles(post: { postId: string; date: Date; body: string }): PostArticle[] {
	const slugger = new GithubSlugger();

	const { articles } = post.body.split('\n').reduce<{
		articles: PostArticle[];
		genre: string;
		current: PostArticle | undefined;
		inFence: boolean;
	}>(
		// bodyの中身を1行ずつ処理する
		// stateの初期値は{ articles: [], genre: '', current: undefined, inFence: false }
		(state, line) => {
			// コードフェンス内の場合はinFenceをtrueにして処理をスキップする
			// e.g. mermaidの図など
			if (FENCE.test(line)) {
				state.inFence = !state.inFence;
				state.current = undefined;
				return state;
			}
			// コードフェンス内の場合は処理をスキップする
			if (state.inFence) {
				return state;
			}

			const heading = line.match(HEADING);
			// 見出しの場合はgenreを設定する
			if (heading) {
				const [, hashes, rawText] = heading;
				const text = toTextContent(rawText);
				const anchor = slugger.slug(text);
				state.current = undefined;

				// H2の場合はgenreを設定する
				if (hashes.length === 2) {
					state.genre = text;
					return state;
				}

				// H3の場合は記事を追加する
				const link = hashes.length === 3 ? rawText.match(LINK_HEADING) : null;
				if (!link) {
					return state;
				}

				const article: PostArticle = {
					postId: post.postId,
					date: post.date,
					genre: state.genre,
					title: link[1],
					url: link[2],
					anchor,
					categories: [state.genre].filter(Boolean),
				};
				state.articles.push(article);
				state.current = article;
				return state;
			}

			const comment = line.match(CATEGORIES_COMMENT);
			// categoriesコメントの場合はcategoriesを設定する
			if (comment && state.current) {
				const explicit = comment[1]
					.split(',')
					.map((name) => name.trim())
					.filter(Boolean);
				state.current.categories = [...new Set([state.current.genre, ...explicit])].filter(Boolean);
				state.current = undefined;
			} else if (line.trim() !== '') {
				// 本文が始まったら categories コメントの受け付けを打ち切る。
				// 本文中に紛れ込んだ（あるいは引用された）コメントを誤って拾わないため、
				// コメントは「見出しの直後（空行のみ挟んでよい）」に限定する
				state.current = undefined;
			}

			return state;
		},
		{ articles: [], genre: '', current: undefined, inFence: false },
	);

	return articles;
}
