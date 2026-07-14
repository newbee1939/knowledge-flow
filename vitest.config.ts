/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

// getViteConfig() を使うと、Astro の解決設定（エイリアス等）をそのままテストに引き継げる。
// https://docs.astro.build/en/guides/testing/
export default getViteConfig({
	test: {
		include: ['src/**/*.test.ts'],
	},
});
