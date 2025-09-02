import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig( ({mode}) => {

	// Load environment variables
	const env = loadEnv(mode, process.cwd(), '');

	return {
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		fs: { allow: ['styled-system'] }
	},
	css: {
		postcss: true
	},
	define: {
		// Make environment variables available to the app (server-side)
		'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
		'import.meta.env.VITE_DB_LOGGING': 'true'
	},
	optimizeDeps: {
			exclude: ['typeorm', 'reflect-metadata'], // Exclude from Vite optimization
	},
	ssr: {
			external: ['typeorm', 'reflect-metadata'], // Treat as external for SSR
	},
	}

});