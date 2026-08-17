<script lang="ts">
	import { goto } from '$app/navigation';
	import { mealPlan } from '$lib/stores/mealPlan.svelte.js';
	import { api } from '$lib/services/api.js';
	import Icon from '$lib/components/Icon.svelte';
	import type { GenerateRequest } from '$lib/types/index.js';

	let regenerating = $state(false);

	const saved = $derived(mealPlan.savedPlans);
	const recent = $derived(saved.slice(0, 3));
	const currentPlan = $derived(mealPlan.current);

	const currentStatus = $derived.by(() => {
		if (!currentPlan) return { label: 'No active meal plan', variant: 'warning' as const };
		const end = new Date(currentPlan.week_end_date);
		const today = new Date();
		const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);
		if (daysLeft < 0) return { label: 'Your last meal plan ended', variant: 'neutral' as const };
		if (daysLeft === 0) return { label: 'Your meal plan ends today', variant: 'warning' as const };
		return { label: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left on this plan`, variant: 'success' as const };
	});

	const budget = $derived(mealPlan.lastInputs?.budget ?? 0);
	const costMin = $derived(
		(currentPlan?.shopping_list ?? []).reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.est_price_min, 0), 0)
	);
	const costMax = $derived(
		(currentPlan?.shopping_list ?? []).reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.est_price_max, 0), 0)
	);
	const budgetPct = $derived(budget > 0 ? Math.min(Math.round((costMax / budget) * 100), 100) : 0);
	const withinBudget = $derived(budget === 0 || costMax <= budget);

	const weekday = $derived(
		new Date().toLocaleDateString('en-IN', { weekday: 'long' })
	);

	function openPlan(id: string) {
		mealPlan.loadPlan(id);
		goto('/meal-plan');
	}

	async function useSame() {
		await goto('/generate?use=last');
	}

	async function repeat() {
		if (!mealPlan.lastInputs) return;
		regenerating = true;
		try {
			const plan = await api.generate(mealPlan.lastInputs as GenerateRequest);
			await mealPlan.setPlan(plan);
			await goto('/meal-plan');
		} finally {
			regenerating = false;
		}
	}

	function formatWeek(p: { week_start_date: string; week_end_date: string }) {
		return `${p.week_start_date} – ${p.week_end_date}`;
	}
</script>

<svelte:head>
	<title>Dashboard - MealinBudget</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="font-display text-2xl font-extrabold">
			{weekday}&rsquo;s dinners are covered.
		</h1>
		<p class="text-sm text-base-content/60 mt-1">
			{#if currentPlan}
				{currentStatus.label}
			{:else}
				No active meal plan yet — one tap and you&rsquo;re set.
			{/if}
		</p>
	</div>

	{#if currentPlan}
		<div class="card bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-lg shadow-primary/25">
			<div class="card-body p-5">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm font-medium text-primary-content/80">Weekly budget</span>
					<span class="badge badge-ghost badge-sm bg-white/20 text-white border-0">{currentPlan.meals.length} meals</span>
				</div>
				{#if budget > 0}
				<p class="font-display text-3xl font-extrabold">
					₹{budget}
						<span class="text-base font-medium text-primary-content/70">
							· est. ₹{costMin}-{costMax}
						</span>
					</p>
					<div class="bg-white/20 rounded-full p-1 mt-3">
						<progress
							class="progress {withinBudget ? 'progress-success' : 'progress-error'} w-full"
							value={budgetPct}
							max="100"
						></progress>
					</div>
					<p class="mt-2 text-sm text-primary-content/85">
						{withinBudget
							? `Within budget — estimated ₹${costMin}-${costMax} vs ₹${budget}`
							: `Over budget — estimated ₹${costMin}-${costMax} vs ₹${budget}`}
					</p>
				{:else}
					<p class="font-display text-3xl font-extrabold">₹{costMin}-{costMax}</p>
					<p class="mt-1 text-sm text-primary-content/70">Estimated shopping cost</p>
				{/if}
			</div>
		</div>
	{:else}
		<div class="alert alert-warning shadow-sm">
			<Icon name="Info" size={20} />
			<span>{currentStatus.label}</span>
		</div>
	{/if}

	<div class="join w-full">
		<a href="/generate" class="btn btn-primary join-item flex-1 gap-1.5">
			<Icon name="Plus" size={18} />
			Generate New
		</a>
		<button
			class="btn btn-outline join-item flex-1 gap-1.5"
			onclick={useSame}
			disabled={!mealPlan.lastInputs}
			title={mealPlan.lastInputs ? '' : 'Generate a plan first to reuse its settings'}
		>
			<Icon name="Settings2" size={18} />
			Use Same
		</button>
		<button class="btn btn-outline join-item flex-1 gap-1.5" onclick={repeat} disabled={!mealPlan.lastInputs}>
			{#if regenerating}
				<span class="loading loading-spinner loading-sm"></span>
			{:else}
				<Icon name="RefreshCw" size={18} />
			{/if}
			Repeat
		</button>
	</div>

	<div>
		<h2 class="font-display text-lg font-semibold mb-3">Recent Plans</h2>
		{#if mealPlan.loading}
			<div class="space-y-3">
				{#each [0, 1, 2] as i}
					<div class="skeleton h-20 w-full"></div>
				{/each}
			</div>
		{:else if recent.length === 0}
			<div class="card bg-base-200/60">
				<div class="card-body items-center text-center text-base-content/60 py-10">
					<span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary mb-2">
						<Icon name="Utensils" size={28} />
					</span>
					<p class="text-sm font-medium text-base-content/80 mb-1">Nothing planned yet.</p>
					<p class="text-xs mb-4">Pick a budget, get a week of meals and a shopping list.</p>
					<a href="/generate" class="btn btn-primary btn-sm gap-1.5">
						<Icon name="Sparkles" size={16} />
						Plan my first week
					</a>
				</div>
			</div>
		{:else}
			<div class="list bg-base-100 shadow-sm rounded-box border border-base-300/70 divide-y divide-base-300/70">
				{#each recent as plan (plan.meal_plan_id)}
					<button
						type="button"
						class="list-row w-full text-left cursor-pointer hover:bg-primary/5 transition-colors"
						onclick={() => openPlan(plan.meal_plan_id)}
					>
						<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
							<Icon name="CalendarDays" size={20} />
						</span>
						<div class="flex-1">
							<h3 class="font-semibold">Week of {formatWeek(plan)}</h3>
							<p class="text-xs text-base-content/60">{plan.meals.length} meals planned</p>
						</div>
						<span class="badge badge-primary badge-sm shrink-0">{plan.meals.length} meals</span>
						<Icon name="ChevronRight" size={18} class="text-base-content/40 shrink-0" />
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>