// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';
import { rehypeExternalLinks } from './src/lib/rehypeExternalLinks.ts';

// mermaid の既定テーマは薄紫・arial で、サイトの配色（モノクロ、青を使わない）と合わない。
// 図はビルド時に SVG へ焼かれるので、色を実値で埋めるとダークモードに追従できない。
// そこで themeVariables ではライト基準の値を渡し（mermaid は色を計算に使うため実値が必須）、
// 実際に目に入る色だけ themeCSS から global.css の CSS 変数で上書きして追従させる。
const mermaidConfig = {
	theme: 'base',
	// 既定の HTML ラベル（foreignObject）だと、ラベル内の <br/> が SVG 出力時に
	// <br></br> へ壊れ、2行目以降が foreignObject の高さから溢れて消える。
	// SVG の text/tspan で描く htmlLabels: false ならこの問題が起きない。
	// flowchart.htmlLabels は deprecated なので、グローバル側に指定する。
	htmlLabels: false,
	themeVariables: {
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Segoe UI", Roboto, sans-serif',
		fontSize: '14px',
		background: '#fdfdfc',
		primaryColor: '#f4f3f0',
		primaryBorderColor: '#e2e0dc',
		primaryTextColor: '#1b1a18',
		lineColor: '#6d6a64',
	},
	themeCSS: `
		.node rect, .node circle, .node ellipse, .node polygon, .node path {
			fill: var(--color-surface);
			stroke: var(--color-border);
			stroke-width: 1px;
		}
		/* サイトの角丸は 3px 止まり。mermaid が rect に付ける rx 属性を CSS 側から上書きする */
		.node rect { rx: 3px; ry: 3px; }
		/* htmlLabels: false なのでラベルは SVG の text。既定テーマは .label text という
		 * より詳細度の高いセレクタで黒を焼き込むので、同じ形のセレクタで上書きする */
		text, .label text, .cluster-label text, .cluster text, .edgeLabel {
			fill: var(--color-text);
			color: var(--color-text);
		}
		.marker, .marker.cross { fill: var(--color-text-muted); stroke: var(--color-text-muted); }
		.flowchart-link, .edgePath .path, .messageLine0, .messageLine1 { stroke: var(--color-text-muted); }
		/* 線の上に乗るラベルは、下の線が透けないよう本文と同じ地色で塗る */
		.edgeLabel rect, rect.background { fill: var(--color-bg); }
		.cluster rect { fill: transparent; stroke: var(--color-border); }
		/* sequenceDiagram は flowchart と別系統のクラスを使うので個別に上書きする。
		 * 注記は既定で黄色（#fff5ad）が焼き込まれ、ダークで浮く。 */
		.actor, .labelBox, .note, rect.note { fill: var(--color-surface); stroke: var(--color-border); }
		.actor-line, .loopLine { stroke: var(--color-border); fill: none; }
		/* sequenceDiagram の矢印は class ではなく id 末尾で選択されている（[id$="-arrowhead"]）。
		 * 同じ形のセレクタでないと詳細度で負けて、既定の黒がダークで背景に沈む。 */
		[id$="-arrowhead"] path { fill: var(--color-text-muted); stroke: var(--color-text-muted); }
		[id$="-crosshead"] path { stroke: var(--color-text-muted); }
		.messageText, text.actor > tspan, .noteText, .noteText > tspan,
		.labelText, .labelText > tspan, .loopText, .loopText > tspan {
			fill: var(--color-text);
			stroke: none;
		}
	`,
};

// GitHub Pages はプロジェクトページとして https://<user>.github.io/<repo>/ で公開される。
// site と base を設定しないと、本番だけ CSS と画像が 404 になる（ARCHITECTURE.md の落とし穴 3）。
export default defineConfig({
	site: 'https://newbee1939.github.io',
	base: '/knowledge-flow',
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
		processor: unified({
			rehypePlugins: [[rehypeMermaid, { mermaidConfig }], rehypeExternalLinks],
		}),
	},
});
