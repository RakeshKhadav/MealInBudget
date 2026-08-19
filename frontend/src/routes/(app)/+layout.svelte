<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons.js';

	let { children } = $props();

	const tabs: { href: string; label: string; icon: IconName }[] = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'House' },
		{ href: '/meal-plan', label: 'Meal Plan', icon: 'Utensils' },
		{ href: '/shopping-list', label: 'Shopping', icon: 'ShoppingCart' },
		{ href: '/nutrition', label: 'Nutrition', icon: 'ChartColumn' },
		{ href: '/generate', label: 'Generate', icon: 'Sparkles' }
	];

	const current = $derived(page.url.pathname);
</script>

<div class="h-dvh flex flex-col bg-base-100">
	<header class="shrink-0 sticky top-0 z-30 bg-base-100/85 backdrop-blur border-b border-base-300/60">
		<div class="mx-auto max-w-lg navbar px-4">
			<div class="flex-1">
				<a href="/" class="inline-flex items-center gap-2">
					<img src="/logo_name.png" alt="MealinBudget" class="h-7 w-auto" />
				</a>
			</div>
		</div>
	</header>

	<main class="flex-1 overflow-y-auto mx-auto max-w-lg w-full px-4 pt-5 pb-32">
		{@render children()}
	</main>

	<nav class="dock dock-sm mx-auto max-w-lg z-40" aria-label="Main navigation">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class={current === tab.href ? 'dock-active text-primary' : 'text-base-content/60'}
				aria-current={current === tab.href ? 'page' : undefined}
			>
				<Icon name={tab.icon} size={20} />
				<span class="dock-label">{tab.label}</span>
			</a>
		{/each}
	</nav>
</div>
