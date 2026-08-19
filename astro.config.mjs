// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';
import { rehypeExternalLinks } from './src/lib/rehypeExternalLinks.ts';
import { rehypeInternalLinks } from './src/lib/rehypeInternalLinks.ts';

// mermaid の既定テーマは薄紫・arial で、サイトの配色（モノクロ、青を使わない）と合わない。
// 図はビルド時に SVG へ焼かれるため、色を実値で書くとダークモードに追従できない。
// themeVariables には mermaid が色計算に使う実値を渡し、目に入る色は themeCSS から
// CSS 変数で上書きする。既定テーマは `.label text` のような詳細度の高いセレクタで色を
// 焼き込むので、同じ形のセレクタでないと勝てない。
const mermaidConfig = {
	theme: 'base',
	// 既定の HTML ラベル（foreignObject）ではラベル内の <br/> が SVG 出力時に
	// <br></br> へ壊れ、2行目以降が消える。SVG の text で描けばこの問題が起きない。
	htmlLabels: false,
	themeVariables: {
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Segoe UI", Roboto, sans-serif',
		fontSize: '14px',
		primaryColor: '#f4f3f0',
		primaryBorderColor: '#e2e0dc',
		primaryTextColor: '#1b1a18',
		lineColor: '#6d6a64',
	},
	themeCSS: `
		/* 面: ノード、サブグラフの枠、シーケンス図のアクターと注記（注記の既定は黄色） */
		.node rect, .actor, .note { fill: var(--color-surface); stroke: var(--color-border); }
		.node rect { rx: 3px; ry: 3px; }
		.cluster rect { fill: transparent; stroke: var(--color-border); }
		/* 文字。線の上に重なるエッジラベルだけ、下の線を隠すため地色で塗る */
		text, .label text, .cluster text, .messageText, text.actor > tspan, .noteText > tspan {
			fill: var(--color-text);
		}
		.edgeLabel rect, rect.background { fill: var(--color-bg); }
		/* 線と矢印。シーケンス図の矢印だけ [id$="-arrowhead"] という別系統の指定になっている */
		.marker, [id$="-arrowhead"] path { fill: var(--color-text-muted); stroke: var(--color-text-muted); }
		.flowchart-link, .edgePath .path, .messageLine0, .messageLine1 { stroke: var(--color-text-muted); }
		.actor-line { stroke: var(--color-border); }
	`,
};

// GitHub Pages はプロジェクトページとして https://<user>.github.io/<repo>/ で公開される。
// site と base を設定しないと、本番だけ CSS と画像が 404 になる（ARCHITECTURE.md の落とし穴 3）。
const base = '/knowledge-flow';

export default defineConfig({
	site: 'https://newbee1939.github.io',
	base,
	markdown: {
		// mermaid 図をビルド時にインライン SVG へ変換する。クライアント JS を配らない
		// （ARCHITECTURE.md の落とし穴 4）。既定の 'inline-svg' 戦略をそのまま使う。
		// Shiki が先に mermaid コードブロックをハイライト用の <pre> に作り替えてしまうと
		// rehype-mermaid が `language-mermaid` を検出できなくなるため、mermaid だけ除外する。
		syntaxHighlight: {
			type: 'shiki',
			// excludeLangs は既定値（['math']）を丸ごと上書きするため、既定の除外も明示的に残す。
			excludeLangs: ['math', 'mermaid'],
		},
		// 記事内の外部リンク（元記事へのリンクなど）は新しいタブで開く。
		// サイト内リンクは対象外。rehypeExternalLinks の詳細は src/lib/rehypeExternalLinks.ts
		//
		// 記事本文に書いたサイト内リンク（`/blog/…`）には base を付ける。
		// 詳細は src/lib/rehypeInternalLinks.ts
		processor: unified({
			rehypePlugins: [
				[rehypeMermaid, { mermaidConfig }],
				rehypeExternalLinks,
				[rehypeInternalLinks, base],
			],
		}),
	},
});
