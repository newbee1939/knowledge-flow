// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages はプロジェクトページとして https://<user>.github.io/<repo>/ で公開される。
// site と base を設定しないと、本番だけ CSS と画像が 404 になる（ARCHITECTURE.md の落とし穴 3）。
export default defineConfig({
  site: 'https://newbee1939.github.io',
  base: '/knowledge-flow',
});
