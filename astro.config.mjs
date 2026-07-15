// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

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
		processor: unified({ rehypePlugins: [rehypeMermaid] }),
	},
});
