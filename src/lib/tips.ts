// markdown のリンク先 `](/tips/<slug>` から slug を取る。末尾のスラッシュ・`#見出し` は
// 付いていても付いていなくてもよい（どちらの書き方も検査の対象にする）。
const TIP_LINK = /\]\(\/tips\/([^)#/\s]*)/g;

/**
 * 日次レポート本文に書かれた Tips へのリンク（`/tips/<slug>/`）のうち、
 * 存在しない Tips を指しているものを返す。
 *
 * リンク切れは 404 になるだけで、ビルドもリンク先の HTTP も静かに通ってしまう。
 * Tips の slug は後から変えたくなる（改名・統合）ため、参照が取り残されても
 * 気づけない。ここで拾ってビルドを止める。
 */
export function findBrokenTipLinks(
	posts: { id: string; body: string }[],
	tipSlugs: string[],
): { postId: string; slug: string }[] {
	const existingSlugs = new Set(tipSlugs);
	return posts.flatMap((post) =>
		[...post.body.matchAll(TIP_LINK)]
			.map((match) => match[1])
			.filter((slug) => !existingSlugs.has(slug))
			.map((slug) => ({ postId: post.id, slug })),
	);
}
