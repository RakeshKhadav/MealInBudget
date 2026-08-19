<script lang="ts">
	import { goto } from '$app/navigation';
	import { mealPlan } from '$lib/stores/mealPlan.svelte.js';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons.js';
	import type { MealType } from '$lib/types/index.js';

	const plan = $derived(mealPlan.current);

	const today = $derived(new Date());

	function parseDate(s: string): Date {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d);
	}

	const isCurrentWeek = $derived(
		plan !== null &&
			today >= parseDate(plan.week_start_date) &&
			today <= new Date(`${plan.week_end_date}T23:59:59`)
	);

	const greeting = $derived.by(() => {
		const h = today.getHours();
		if (h < 12) return 'Good morning!';
		if (h < 17) return 'Good afternoon!';
		return 'Good evening!';
	});

	const budget = $derived(mealPlan.lastInputs?.budget ?? 0);
	const people = $derived(mealPlan.lastInputs?.people_count);

	const costMin = $derived(
		(plan?.shopping_list ?? []).reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.est_price_min, 0), 0)
	);
	const costMax = $derived(
		(plan?.shopping_list ?? []).reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.est_price_max, 0), 0)
	);
	const budgetPct = $derived(budget > 0 ? Math.min(Math.round((costMax / budget) * 100), 100) : 0);
	const withinBudget = $derived(budget === 0 || costMax <= budget);
	const overAmount = $derived(costMax - budget);

	const daysLeft = $derived.by(() => {
		if (!plan) return 0;
		return Math.max(0, Math.ceil((parseDate(plan.week_end_date).getTime() - today.getTime()) / 86400000));
	});

	const typeMeta: Record<MealType, { icon: IconName; label: string; tile: string }> = {
		breakfast: { icon: 'Sunrise', label: 'Breakfast', tile: 'bg-secondary/25 text-secondary-content' },
		lunch: { icon: 'Sun', label: 'Lunch', tile: 'bg-accent/25 text-accent-content' },
		dinner: { icon: 'Moon', label: 'Dinner', tile: 'bg-primary/15 text-primary' }
	};

	let failedImages = $state<string[]>([]);

	function mealKey(day: number, mealType: MealType): string {
		return `${day}-${mealType}`;
	}

	function onImgError(key: string) {
		if (!failedImages.includes(key)) failedImages = [...failedImages, key];
	}
</script>

<svelte:head>
	<title>Dashboard - MealinBudget</title>
</svelte:head>

{#if mealPlan.loading}
	<div class="space-y-6 font-display">
		<div class="space-y-2">
			<div class="skeleton h-8 w-48"></div>
			<div class="skeleton h-4 w-32"></div>
		</div>
		<div class="skeleton h-44 w-full rounded-3xl"></div>
		<div class="flex gap-3 overflow-hidden">
			{#each [0, 1, 2] as i (i)}
				<div class="skeleton h-40 w-36 shrink-0 rounded-3xl"></div>
			{/each}
		</div>
	</div>
{:else if !isCurrentWeek}
	<div class="flex flex-col items-center text-center pt-14 pb-6 font-display">
		<span class="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/12 text-primary mb-5">
			<Icon name="Utensils" size={40} />
		</span>
		<h1 class="font-display text-2xl font-extrabold">{greeting}</h1>
		<p class="text-sm text-base-content/60 mt-1">No budget set for this week yet.</p>
		<a
			href="/generate"
			class="btn btn-primary btn-xl gap-2 px-8 rounded-full shadow-lg shadow-primary/25 mt-7"
		>
			<Icon name="Sparkles" size={20} />
			Set budget for this week
		</a>
	</div>
{:else if plan}
	<div class="space-y-6 font-display">
		<div>
			<h1 class="font-display text-2xl font-extrabold">{greeting}</h1>
			<p class="text-sm text-base-content/60 mt-0.5">Your week, sorted.</p>
		</div>

		<div
			class="card {withinBudget ? 'bg-sunset' : 'bg-gradient-to-br from-error to-error/85'} text-primary-content shadow-lg shadow-primary/25"
		>
			<div class="card-body p-5">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm font-medium text-primary-content/80">This week's budget</span>
					<span class="badge badge-ghost border-0 bg-white/20 text-white badge-sm">
						{daysLeft} day{daysLeft === 1 ? '' : 's'} left
					</span>
				</div>
				<p class="font-display text-4xl font-extrabold">
					₹{budget.toLocaleString('en-IN')}
					<span class="text-base font-medium text-primary-content/70">· est. ₹{costMin}-{costMax}</span>
				</p>
				<div class="bg-white/20 rounded-full p-1 mt-4">
					<progress
						class="progress {withinBudget ? 'progress-success' : 'progress-error'} w-full"
						value={budgetPct}
						max="100"
					></progress>
				</div>
				<div class="flex items-center justify-between mt-3 text-sm text-primary-content/85">
					<span class="inline-flex items-center gap-1.5">
						<Icon name="Users" size={15} />
						{people} {people === 1 ? 'person' : 'people'}
					</span>
					<span class="inline-flex items-center gap-1.5">
						<Icon name="Utensils" size={15} />
						{plan.meals.length} meals
					</span>
					<span class="inline-flex items-center gap-1.5">
						<Icon name="Wallet" size={15} />
						{#if withinBudget}In budget{:else}Over by ₹{overAmount}{/if}
					</span>
				</div>
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-display text-lg font-semibold">This week's meals</h2>
				<a href="/meal-plan" class="text-sm font-medium text-primary inline-flex items-center gap-0.5">
					See all
					<Icon name="ChevronRight" size={15} />
				</a>
			</div>
			<div class="carousel carousel-horizontal carousel-start gap-3 -mx-4 px-4 overflow-x-auto no-scrollbar snap-x pb-1">
				{#each plan.meals as meal (mealKey(meal.day, meal.meal_type))}
					{@const key = mealKey(meal.day, meal.meal_type)}
					<div class="carousel-item snap-start">
						<button
							type="button"
							class="w-36 card bg-base-100 shadow-sm overflow-hidden text-left shrink-0 transition-transform active:scale-[0.97]"
							onclick={() => goto('/meal-plan')}
						>
							{#if meal.image_url && !failedImages.includes(key)}
								<div class="h-24 w-full overflow-hidden">
									<img
										src={meal.image_url}
										alt={meal.meal_name}
										class="h-full w-full object-cover"
										loading="lazy"
										onerror={() => onImgError(key)}
									/>
								</div>
							{:else}
								<div class="flex h-24 w-full items-center justify-center {typeMeta[meal.meal_type].tile}">
									<Icon name={typeMeta[meal.meal_type].icon} size={28} />
								</div>
							{/if}
							<div class="p-2.5">
								<p class="font-display text-sm font-semibold truncate">{meal.meal_name}</p>
								<p class="text-[11px] text-base-content/60 inline-flex items-center gap-1 mt-0.5">
									<Icon name="Clock" size={11} />
									{meal.cooking_time_mins} min · {typeMeta[meal.meal_type].label}
								</p>
							</div>
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
