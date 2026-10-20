import GithubSlugger from 'github-slugger';

/** 日次レポート内の 1 記事（H3 見出し 1 つ分）。 */
export interface PostArticle {
	/** 記事が属する post のファイル名由来 ID（例: "2026-07-18"） */
	postId: string;
	date: Date;
	/** H2 見出しのジャンル（AI / Infra / Backend / Frontend / Products / Others） */
	genre: string;
	title: string;
	/** 元記事の URL */
	url: string;
	/** 日次レポートページ内の見出しアンカー（`/blog/<postId>/#<anchor>` で記事へ飛べる） */
	anchor: string;
	/** ジャンル＋明示カテゴリ（重複除去済み）。明示カテゴリは見出し直後の categories コメントで付与する */
	categories: string[];
	/** 管理人のピックアップ（はてブ由来）の記事か。このジャンルは技術カテゴリではないので categories に入れない */
	pickup: boolean;
}

const PICKUP_GENRE = '管理人のピックアップ';

const FENCE = /^\s*(?:```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*?)\s*$/;
const LINK_HEADING = /^\[(.+)\]\((\S+)\)$/;
const CATEGORIES_COMMENT = /^<!--\s*categories:\s*(.*?)\s*-->$/;

/** markdown のインラインリンク `[text](url)` を text に落とし、見出しの表示テキストへ寄せる */
const toTextContent = (rawHeading: string): string =>
	rawHeading.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

/**
 * コードフェンス内（Mermaid 図など）の行を空行に置き換える。
 * フェンス内の `##` や `<!-- -->` を見出し・コメントと誤検知しないための前処理。
 * 区切りの ``` 行自体は残す（見出しにもコメントにもマッチしないので無害で、
 * readExplicitCategories の先読みを止める役割がある）。
 */
const maskFencedLines = (lines: string[]): string[] =>
	// body の各行を先頭から順に処理する
	lines.reduce<{ masked: string[]; inFence: boolean }>(
		(state, line) => {
			// ``` か ~~~ の行の場合
			if (FENCE.test(line)) {
				state.inFence = !state.inFence;
				state.masked.push(line);
			} else {
				state.masked.push(state.inFence ? '' : line);
			}
			return state;
		},
		{ masked: [], inFence: false },
	).masked;

/**
 * from 行以降を先読みし、見出し直後の categories コメントを読む。
 * 空行だけは読み飛ばし、最初の空行でない行がコメントでなければ「無し」（空配列）。
 * 本文開始後のコメントを誤って拾わないための制約（見出し直後・空行のみ挟んでよい）。
 */
const readExplicitCategories = (lines: string[], from: number): string[] => {
	const firstContent = lines.slice(from).find((line) => line.trim() !== '');
	const comment = firstContent?.match(CATEGORIES_COMMENT);
	if (!comment) {
		return [];
	}
	return comment[1]
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);
};

/**
 * 日次レポートの本文（raw markdown）から記事一覧を抽出する。想定する形:
 *
 * ```markdown
 * ## ジャンル
 * ### [記事タイトル](元記事URL)
 * <!-- categories: TypeScript, Go -->   ← 任意。無ければジャンルのみ
 * ```
 *
 * anchor は「Astro がビルド時に各見出しへ自動付与する id」の予測値で、
 * 一致して初めてカテゴリページからのリンクとして機能する。Astro は全見出しを
 * 文書順に github-slugger へ通し、同名見出しには -1, -2 と連番を付けるため、
 * こちらも「同じ対象を・同じ順で・全部」slug 化してカウンタを同期させる。
 * 例: `## AI` の後に `### [AI](…)` が来ると id は ai / ai-1 になる。もし H2 を
 * 飛ばして数えると記事の anchor を ai と誤予測し、リンクは記事ではなく
 * ジャンル見出しに着地してしまう。
 */
export function extractArticles(post: { postId: string; date: Date; body: string }): PostArticle[] {
	// コードフェンス内の行を空行に置き換える
	const lines = maskFencedLines(post.body.split('\n'));
	const slugger = new GithubSlugger();

	// 全見出しを文書順に slug 化する（Astro とカウンタを同期させるため、H3 以外も飛ばさない）
	const headings = lines.flatMap((line, index) => {
		const heading = line.match(HEADING);
		if (!heading) {
			return [];
		}
		const [, hashes, rawText] = heading;
		const text = toTextContent(rawText);
		return [{ level: hashes.length, rawText, text, anchor: slugger.slug(text), index }];
	});

	// リンク付きの H3 見出しを記事にする。ジャンルは直前の H2 見出し
	return headings.flatMap((heading, i) => {
		const link = heading.level === 3 ? heading.rawText.match(LINK_HEADING) : null;
		if (!link) {
			return [];
		}
		const genre = headings.slice(0, i).findLast((h) => h.level === 2)?.text ?? '';
		const pickup = genre === PICKUP_GENRE;
		const categories = [
			...(pickup ? [] : [genre]),
			...readExplicitCategories(lines, heading.index + 1),
		];
		return [
			{
				postId: post.postId,
				date: post.date,
				genre,
				title: link[1],
				url: link[2],
				anchor: heading.anchor,
				categories: [...new Set(categories)].filter(Boolean),
				pickup,
			},
		];
	});
}
