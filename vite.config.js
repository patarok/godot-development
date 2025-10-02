import { sveltekit } from '@sveltejs/kit/vite';
import tailwind from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load environment variables
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			tailwind(),
			sveltekit(),
		],
		server: {
			host: '0.0.0.0',
			port: 5173,
			fs: { allow: ['styled-system'] },
		},
		css: {
			postcss: true,
		},
		define: {
			// Make environment variables available to the app (server-side)
			'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
			'import.meta.env.VITE_DB_LOGGING': 'true',
		},
		optimizeDeps: {
			// Pre-bundle these to guarantee a single instance across the graph
			include: [
				'@dnd-kit-svelte/core',
				'@dnd-kit-svelte/sortable',
				'@dnd-kit-svelte/modifiers',
			],
			exclude: ['typeorm', 'reflect-metadata'], // Exclude from Vite optimization
		},
		resolve: {
			// Ensure a single runtime instance for these packages (prevents context splits)
			dedupe: [
				'@dnd-kit-svelte/core',
				'@dnd-kit-svelte/sortable',
				'@dnd-kit-svelte/modifiers',
			],
		},
		ssr: {
			// Compile these as part of the SSR bundle to avoid separate instances on server/client
			noExternal: [
				'svelte-sonner',
				'@dnd-kit-svelte/core',
				'@dnd-kit-svelte/sortable',
				'@dnd-kit-svelte/modifiers',
			],
			external: ['typeorm', 'reflect-metadata'], // Treat as external for SSR
		},
	};
});