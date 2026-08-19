<script lang="ts">
	import { mealPlan } from '$lib/stores/mealPlan.svelte.js';
	import MealCard from '$lib/components/MealCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons.js';
	import type { Meal, MealType } from '$lib/types/index.js';

	let selectedDay = $state(1);
	let selectedMeal = $state<Meal | null>(null);
	let selectedType = $state<'all' | MealType>('all');
	let modalImgFailed = $state(false);

	$effect(() => {
		modalImgFailed = false;
	});

	const modalTile: Record<MealType, string> = {
		breakfast: 'bg-secondary/20',
		lunch: 'bg-accent/20',
		dinner: 'bg-primary/12'
	};
	const modalEmoji: Record<MealType, string> = {
		breakfast: '🌅',
		lunch: '☀️',
		dinner: '🌙'
	};

	const plan = $derived(mealPlan.current);
	const dayMeals = $derived(plan?.meals.filter((m) => m.day === selectedDay) ?? []);
	const visibleMeals = $derived(selectedType === 'all' ? dayMeals : dayMeals.filter((m) => m.meal_type === selectedType));

	const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const mealTypeTabs: { value: 'all' | MealType; label: string; icon: IconName }[] = [
		{ value: 'all', label: 'All', icon: 'LayoutGrid' },
		{ value: 'breakfast', label: 'Breakfast', icon: 'Sunrise' },
		{ value: 'lunch', label: 'Lunch', icon: 'Sun' },
		{ value: 'dinner', label: 'Dinner', icon: 'Moon' }
	];

	function parseDate(s: string): Date {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d);
	}

	const dayChips = $derived(
		plan
			? dayLabels.map((label, i) => {
					const d = parseDate(plan.week_start_date);
					d.setDate(d.getDate() + i);
					return { label, date: d.getDate() };
				})
			: []
	);

	const modalStats = $derived<{ label: string; value: string; icon: IconName; tile: string; iconTile: string }[]>([
		{ label: 'Calories', value: `${selectedMeal?.nutritional_info.calories ?? 0}`, icon: 'Flame', tile: 'bg-error/10', iconTile: 'bg-error/15 text-error' },
		{ label: 'Protein', value: `${selectedMeal?.nutritional_info.protein_g ?? 0}g`, icon: 'Drumstick', tile: 'bg-primary/10', iconTile: 'bg-primary/15 text-primary' },
		{ label: 'Fiber', value: `${selectedMeal?.nutritional_info.fiber_g ?? 0}g`, icon: 'Leaf', tile: 'bg-success/10', iconTile: 'bg-success/15 text-success' }
	]);
</script>

<svelte:head>
	<title>Meal Plan - MealinBudget</title>
</svelte:head>

{#if !plan}
	<div class="text-center py-20 space-y-4 font-display">
		<span class="flex mx-auto h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-4xl">🍽️</span>
		<p class="font-display text-xl font-extrabold">No menu yet</p>
		<p class="text-sm text-base-content/50 -mt-1">Set a budget and we'll cook up a full week of meals.</p>
		<a href="/generate" class="btn btn-primary btn-lg rounded-full px-8 gap-2 shadow-lg shadow-primary/25 mt-2">
			<Icon name="Sparkles" size={18} />
			Make my menu
		</a>
	</div>
{:else}
	<div class="space-y-5 font-display">
		<div class="text-center">
			<h1 class="font-display text-2xl font-extrabold leading-tight inline-flex items-center justify-center gap-2">
				<span class="text-3xl leading-none">🍽️</span>
				This week's menu
			</h1>
		</div>

		<div class="sticky top-[-20px] z-30 -mx-4 px-4 py-3 space-y-2.5 bg-base-100/85 backdrop-blur border-b border-base-300/60">
			<div class="flex gap-2 overflow-x-auto no-scrollbar justify-center py-1">
				{#each mealTypeTabs as tab (tab.value)}
					<button
						class="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all {selectedType === tab.value
							? 'bg-primary text-primary-content shadow-md shadow-primary/25'
							: 'bg-base-200/70 hover:bg-base-200 text-base-content/60'}"
						onclick={() => (selectedType = tab.value)}
						aria-pressed={selectedType === tab.value}
					>
						<span class="inline-flex items-center gap-1.5">
							<Icon name={tab.icon} size={15} />
							{tab.label}
						</span>
					</button>
				{/each}
			</div>

			<div class="flex gap-2 overflow-x-auto no-scrollbar justify-center py-1.5">
				{#each dayChips as chip, i (chip.label)}
					<button
						class="shrink-0 flex flex-col items-center rounded-2xl px-3 py-1.5 transition-all {selectedDay === i + 1
							? 'bg-primary/12 ring-2 ring-primary'
							: 'bg-base-200/70 hover:bg-base-200'}"
						onclick={() => (selectedDay = i + 1)}
						aria-pressed={selectedDay === i + 1}
					>
						<span class="text-[10px] font-semibold">{chip.label}</span>
						<span class="font-display text-lg font-extrabold leading-tight mt-0.5 {selectedDay === i + 1 ? 'text-primary' : ''}">{chip.date}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-3">
			{#each visibleMeals as meal}
				<MealCard {meal} onclick={() => (selectedMeal = meal)} />
			{/each}
			{#if visibleMeals.length === 0}
				<div class="text-center py-12 rounded-3xl bg-base-200/50">
					<span class="text-3xl">🫥</span>
					<p class="text-sm text-base-content/50 mt-2">
						No {selectedType === 'all' ? '' : selectedType} meals on {dayLabels[selectedDay - 1]}.
					</p>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-2 pt-1">
			<a href="/shopping-list" class="btn btn-primary btn-lg rounded-full gap-1.5">
				<Icon name="ShoppingCart" size={18} />
				Shopping list
			</a>
			<a href="/nutrition" class="btn btn-lg rounded-full bg-base-200 hover:bg-base-300 border-0 gap-1.5">
				<Icon name="ChartColumn" size={18} />
				Nutrition
			</a>
		</div>
	</div>
{/if}

<Modal open={selectedMeal !== null} title={selectedMeal?.meal_name} onclose={() => (selectedMeal = null)}>
	{#snippet hero()}
		{#if selectedMeal}
			{#if selectedMeal.image_url && !modalImgFailed}
				<img
					src={selectedMeal.image_url}
					alt={selectedMeal.meal_name}
					class="h-52 w-full object-cover"
					loading="lazy"
					onerror={() => (modalImgFailed = true)}
				/>
			{:else}
				<div class="flex h-52 w-full items-center justify-center {modalTile[selectedMeal.meal_type]}">
					<span class="text-6xl">{modalEmoji[selectedMeal.meal_type]}</span>
				</div>
			{/if}
		{/if}
	{/snippet}

	{#if selectedMeal}
		<div class="flex flex-wrap gap-1.5">
			<span class="badge badge-ghost gap-1">
				<Icon name="Globe" size={12} />
				{selectedMeal.cuisine}
			</span>
			<span class="badge badge-ghost gap-1">
				<Icon name="Clock" size={12} />
				{selectedMeal.cooking_time_mins} min
			</span>
			<span class="badge badge-ghost gap-1">
				<Icon name="ChefHat" size={12} />
				{selectedMeal.difficulty}
			</span>
		</div>

		<div class="grid grid-cols-3 gap-2 mt-3">
			{#each modalStats as stat}
				<div class="flex flex-col items-center gap-1.5 rounded-2xl py-3 {stat.tile}">
					<span class="flex h-9 w-9 items-center justify-center rounded-xl {stat.iconTile} shadow-sm">
						<Icon name={stat.icon} size={18} />
					</span>
					<span class="text-sm font-extrabold leading-none">{stat.value}</span>
					<span class="text-[11px] text-base-content/60">{stat.label}</span>
				</div>
			{/each}
		</div>

		<div class="mt-4">
			<p class="font-bold text-sm">🧺 Ingredients</p>
			<div class="flex flex-wrap gap-1.5 mt-2">
				{#each selectedMeal.ingredients as ing (ing.name)}
					<span class="rounded-full bg-base-200/80 px-3 py-1.5 text-xs font-medium">
						{ing.name} · <span class="font-bold">{ing.qty}{ing.unit}</span>
					</span>
				{/each}
			</div>
		</div>

		<div class="mt-4">
			<p class="font-bold text-sm">👩‍🍳 Steps</p>
			<ol class="text-sm space-y-2 mt-2">
				{#each selectedMeal.instructions as step, i}
					<li class="flex gap-2.5">
						<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">
							{i + 1}
						</span>
						<span>{step}</span>
					</li>
				{/each}
			</ol>
		</div>

		{#if selectedMeal.appliances_needed.length > 0}
			<div class="mt-4">
				<p class="font-bold text-sm">🍳 Appliances</p>
				<div class="flex flex-wrap gap-1.5 mt-2">
					{#each selectedMeal.appliances_needed as appliance (appliance)}
						<span class="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1.5 text-xs font-semibold text-secondary-content ring-1 ring-secondary/25">
							<Icon name="CookingPot" size={13} />
							{appliance}
						</span>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</Modal>
