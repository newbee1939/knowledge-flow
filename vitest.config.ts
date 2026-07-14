import { getViteConfig } from 'astro/config';

// getViteConfig() で Astro の解決設定（import.meta.env.BASE_URL 等）をテストに引き継ぐ。
// https://docs.astro.build/en/guides/testing/
export default getViteConfig({});
