import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		tailwindcss(),
		SvelteKitPWA({
			registerType: 'prompt',
			includeManifestIcons: false,
			manifest: {
				name: 'MealinBudget',
				short_name: 'MealinBudget',
				description: 'AI-powered weekly meal planning within your budget',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				background_color: '#6366f1',
				theme_color: '#6366f1',
				icons: [
					{ src: '/favicon_io/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
					{ src: '/favicon_io/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
					{ src: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
				navigateFallback: '/',
				runtimeCaching: [
					{
						urlPattern: /\/api\//,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							networkTimeoutSeconds: 5,
							expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 }
						}
					}
				]
			}
		})
	]
});