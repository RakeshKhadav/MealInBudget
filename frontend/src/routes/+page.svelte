<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from '$lib/components/Icon.svelte';

	let deferredPrompt = $state<any>(null);
	let installVisible = $state(true);

	$effect(() => {
		if (!browser) return;
		const onPrompt = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e;
			installVisible = true;
		};
		window.addEventListener('beforeinstallprompt', onPrompt);
		if (window.matchMedia('(display-mode: standalone)').matches) installVisible = false;
		return () => window.removeEventListener('beforeinstallprompt', onPrompt);
	});

	async function install() {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		await deferredPrompt.userChoice;
		deferredPrompt = null;
		installVisible = false;
	}
</script>

<svelte:head>
	<title>MealinBudget - 7 dinners, no decisions</title>
</svelte:head>

<div class="min-h-screen bg-cream-wash flex flex-col">
	<header class="navbar max-w-lg mx-auto w-full px-4">
		<div class="flex-1">
			<img src="/logo_name.png" alt="MealinBudget" class="h-7 w-auto" />
		</div>
	</header>

	<main class="flex-1 w-full max-w-lg mx-auto px-6 pt-4 pb-10 flex flex-col justify-center">
		<h1 class="font-display text-4xl font-extrabold tracking-tight leading-tight">
			7 dinners.
			<br />
			<span class="text-primary">One budget.</span>
		</h1>
		<p class="text-base-content/70 mt-3">What would you like to do today?</p>

		<div class="flex flex-col gap-4 mt-8">
			<a
				href="/generate"
				class="group flex items-center gap-4 rounded-3xl bg-primary p-5 shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
			>
				<span
					class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white"
				>
					<Icon name="Sparkles" size={26} />
				</span>
				<span class="flex-1">
					<span class="block font-display text-xl font-extrabold text-white">Generate a plan</span>
					<span class="block text-sm text-white/80 mt-0.5">Answer a few quick questions</span>
				</span>
				<Icon name="ArrowRight" size={20} class="text-white/70 group-hover:translate-x-1 transition-transform" />
			</a>

			<a
				href="/dashboard"
				class="group flex items-center gap-4 rounded-3xl bg-base-100 shadow-sm border border-base-300/60 p-5 transition-transform active:scale-[0.98]"
			>
				<span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/20 text-secondary-content">
					<Icon name="House" size={26} />
				</span>
				<span class="flex-1">
					<span class="block font-display text-xl font-extrabold">My dashboard</span>
					<span class="block text-sm text-base-content/60 mt-0.5">See your week and shopping list</span>
				</span>
				<Icon name="ArrowRight" size={20} class="text-base-content/40 group-hover:translate-x-1 transition-transform" />
			</a>
		</div>

		{#if installVisible}
			<button
				class="btn btn-ghost btn-sm mt-8 gap-2 text-base-content/50"
				onclick={install}
				disabled={!deferredPrompt}
			>
				<Icon name="Smartphone" size={16} />
				Add to Home Screen
			</button>
		{/if}
	</main>
</div>