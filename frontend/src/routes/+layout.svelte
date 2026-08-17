<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/ui.svelte.js';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import ReloadPrompt from '$lib/components/ReloadPrompt.svelte';
	import { browser, dev } from '$app/environment';
	import { mealPlan } from '$lib/stores/mealPlan.svelte.js';

	let { children } = $props();

	$effect(() => {
		if (browser) {
			theme.apply();
			mealPlan.init();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon_io/favicon.ico" />
	<meta name="theme-color" content="#6366f1" />
	<meta name="description" content="AI-powered weekly meal planning within your budget" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="MealinBudget" />
	<link rel="apple-touch-icon" href="/favicon_io/apple-touch-icon.png" />
</svelte:head>

<OfflineBanner />
{#if browser && !dev}
	<ReloadPrompt />
{/if}
{@render children()}