import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		//alias: { 'our-stuff': './src/wheretopackitfrom/*'}
		alias: {
			'styled-system': './src/lib/styled-system/*'
		}
	}
};

export default config;