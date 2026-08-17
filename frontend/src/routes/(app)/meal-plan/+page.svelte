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

	const plan = $derived(mealPlan.current);
	const dayMeals = $derived(plan?.meals.filter((m) => m.day === selectedDay) ?? []);
	const visibleMeals = $derived(selectedType === 'all' ? dayMeals : dayMeals.filter((m) => m.meal_type === selectedType));

	const dayTotal = $derived(
		visibleMeals.reduce(
			(acc, m) => ({
				calories: acc.calories + m.nutritional_info.calories,
				protein: acc.protein + m.nutritional_info.protein_g,
				carbs: acc.carbs + m.nutritional_info.carbs_g,
				fat: acc.fat + m.nutritional_info.fat_g
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0 }
		)
	);

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

	const totalStats = $derived<{ label: string; value: string; unit: string; icon: IconName; color: string }[]>([
		{ label: 'Calories', value: `${dayTotal.calories}`, unit: 'cal', icon: 'Flame', color: 'text-error' },
		{ label: 'Protein', value: `${dayTotal.protein}`, unit: 'g', icon: 'Drumstick', color: 'text-primary' },
		{ label: 'Carbs', value: `${dayTotal.carbs}`, unit: 'g', icon: 'Wheat', color: 'text-warning' },
		{ label: 'Fat', value: `${dayTotal.fat}`, unit: 'g', icon: 'Droplets', color: 'text-info' }
	]);

	const modalStats = $derived<{ label: string; value: string; icon: IconName; color: string }[]>([
		{ label: 'Calories', value: `${selectedMeal?.nutritional_info.calories ?? 0}`, icon: 'Flame', color: 'text-error' },
		{ label: 'Protein', value: `${selectedMeal?.nutritional_info.protein_g ?? 0}g`, icon: 'Drumstick', color: 'text-primary' },
		{ label: 'Fiber', value: `${selectedMeal?.nutritional_info.fiber_g ?? 0}g`, icon: 'Leaf', color: 'text-success' }
	]);
</script>

<svelte:head>
	<title>Meal Plan - MealinBudget</title>
</svelte:head>

{#if !plan}
	<div class="text-center py-16 space-y-4">
		<span class="flex mx-auto h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
			<Icon name="Utensils" size={28} />
		</span>
		<p class="font-medium">No meal plan yet.</p>
		<p class="text-sm text-base-content/60 -mt-2">Pick a budget and get a full week of meals.</p>
		<a href="/generate" class="btn btn-primary gap-1.5">
			<Icon name="Sparkles" size={16} />
			Generate a plan
		</a>
	</div>
{:else}
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h1 class="font-display text-2xl font-extrabold">Weekly Meal Plan</h1>
			<span class="badge badge-primary badge-sm">{plan.meals.length} meals</span>
		</div>
		<p class="text-sm text-base-content/60">
			Week of {plan.week_start_date}
			{#if plan.seasonal_note}
				· <span class="text-warning">{plan.seasonal_note}</span>
			{/if}
		</p>

		<div class="join w-full shadow-sm">
			{#each mealTypeTabs as tab (tab.value)}
				<button
					class="btn btn-sm join-item flex-1 gap-1.5 {selectedType === tab.value ? 'btn-primary' : 'btn-outline border-base-300'}"
					onclick={() => (selectedType = tab.value)}
				>
					<Icon name={tab.icon} size={15} />
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
			{#each dayChips as chip, i (chip.label)}
				<button
					class="flex flex-col items-center rounded-2xl px-3 py-2 transition-all {selectedDay === i + 1
						? 'bg-primary text-primary-content shadow-md shadow-primary/25'
						: 'bg-base-200/70 hover:bg-base-200 text-base-content/70'}"
					onclick={() => (selectedDay = i + 1)}
					aria-pressed={selectedDay === i + 1}
				>
					<span class="text-xs font-semibold">{chip.label}</span>
					<span class="text-lg font-extrabold leading-tight">{chip.date}</span>
				</button>
			{/each}
		</div>

		{#if visibleMeals.length > 0}
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
				<div class="stat bg-base-100 shadow-sm border border-base-300/70 rounded-box px-3 py-2">
					<div class="stat-title text-[11px]">Daily Total</div>
					<div class="stat-value text-base font-display">
						{dayTotal.calories}<span class="text-xs font-normal text-base-content/60"> cal</span>
					</div>
				</div>
				{#each totalStats.slice(1) as stat (stat.label)}
					<div class="stat bg-base-100 shadow-sm border border-base-300/70 rounded-box px-3 py-2">
						<div class="flex items-center justify-between">
							<div class="stat-title text-[11px]">{stat.label}</div>
							<Icon name={stat.icon} size={14} class={stat.color} />
						</div>
						<div class="stat-value text-base font-display">
							{stat.value}<span class="text-xs font-normal text-base-content/60">{stat.unit}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="space-y-3">
			{#each visibleMeals as meal}
				<MealCard {meal} onclick={() => (selectedMeal = meal)} />
			{/each}
			{#if visibleMeals.length === 0}
				<div class="text-center py-10 text-sm text-base-content/60 bg-base-200/50 rounded-2xl">
					No {selectedType === 'all' ? '' : selectedType} meals on {dayLabels[selectedDay - 1]}.
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-2">
			<a href="/shopping-list" class="btn btn-primary gap-1.5">
				<Icon name="ShoppingCart" size={18} />
				Shopping List
			</a>
			<a href="/nutrition" class="btn btn-outline border-base-300 gap-1.5">
				<Icon name="ChartColumn" size={18} />
				Nutrition
			</a>
		</div>
	</div>
{/if}

<Modal open={selectedMeal !== null} title={selectedMeal?.meal_name} onclose={() => (selectedMeal = null)}>
	{#if selectedMeal}
		<div class="space-y-4">
			<div class="flex flex-wrap gap-2">
				<span class="badge badge-ghost">{selectedMeal.cuisine}</span>
				<span class="badge badge-outline">
					<Icon name="Clock" size={12} />
					{selectedMeal.cooking_time_mins} mins
				</span>
				<span class="badge badge-outline">
					<Icon name="ChefHat" size={12} />
					{selectedMeal.difficulty}
				</span>
			</div>

			{#if selectedMeal.appliances_needed.length > 0}
				<p class="text-sm text-base-content/70 inline-flex items-center gap-1.5">
					<Icon name="CookingPot" size={15} />
					Uses: {selectedMeal.appliances_needed.join(', ')}
				</p>
			{/if}

			<div>
				<p class="font-semibold mb-1.5">Ingredients</p>
				<ul class="text-sm space-y-1.5">
					{#each selectedMeal.ingredients as ing}
						<li class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-primary/60 shrink-0"></span>
							{ing.name}:
							<span class="font-medium">{ing.qty}{ing.unit}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div>
				<p class="font-semibold mb-1.5">Instructions</p>
				<ol class="text-sm space-y-2">
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

			<div class="grid grid-cols-3 gap-2 pt-1">
				{#each modalStats as stat}
					<div class="flex flex-col items-center gap-1 rounded-xl bg-base-200/80 py-2.5">
						<Icon name={stat.icon} size={18} class={stat.color} />
						<span class="text-sm font-bold">{stat.value}</span>
						<span class="text-[11px] text-base-content/60">{stat.label}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</Modal>
