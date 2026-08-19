<script lang="ts">
	import { mealPlan } from '$lib/stores/mealPlan.svelte.js';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/types/icons.js';
	import type { Mood } from '$lib/types/index.js';

	const plan = $derived(mealPlan.current);

	const MOOD_META: Record<Mood, { label: string; emoji: string; targets: { calories: number; protein: number; carbs: number; fat: number } }> = {
		spicy_indian: { label: 'Spicy Indian', emoji: '🌶️', targets: { calories: 2100, protein: 65, carbs: 260, fat: 70 } },
		quick_easy: { label: 'Quick & Easy', emoji: '⚡', targets: { calories: 1950, protein: 55, carbs: 240, fat: 60 } },
		protein_packed: { label: 'Protein Packed', emoji: '💪', targets: { calories: 2200, protein: 80, carbs: 250, fat: 65 } },
		low_calorie: { label: 'Low Calorie', emoji: '🏃', targets: { calories: 1700, protein: 55, carbs: 200, fat: 50 } },
		budget_minimal: { label: 'Budget Minimal', emoji: '💰', targets: { calories: 1900, protein: 60, carbs: 250, fat: 55 } }
	};

	const mood = $derived<Mood>(mealPlan.lastInputs?.moods?.[0] ?? 'spicy_indian');
	const moodMeta = $derived(MOOD_META[mood]);

	interface NutritionStat {
		label: string;
		value: number;
		unit: string;
		icon: IconName;
		color: string;
		tile: string;
	}

	interface TargetStat {
		label: string;
		value: number;
		unit: string;
		icon: IconName;
		color: string;
		target: number;
	}

	const daily = $derived<NutritionStat[]>(
		plan
			? [
					{ label: 'Calories', value: plan.nutritional_summary.daily_avg_calories, unit: 'cal', icon: 'Flame', color: 'text-error', tile: 'bg-error/12 text-error' },
					{ label: 'Protein', value: plan.nutritional_summary.daily_avg_protein, unit: 'g', icon: 'Drumstick', color: 'text-primary', tile: 'bg-primary/12 text-primary' },
					{ label: 'Carbs', value: plan.nutritional_summary.daily_avg_carbs, unit: 'g', icon: 'Wheat', color: 'text-warning', tile: 'bg-warning/15 text-warning' },
					{ label: 'Fat', value: plan.nutritional_summary.daily_avg_fat, unit: 'g', icon: 'Droplets', color: 'text-info', tile: 'bg-info/15 text-info' }
				]
			: []
	);

	const progress = $derived<TargetStat[]>(
		plan
			? [
					{ label: 'Calories', value: plan.nutritional_summary.daily_avg_calories, target: moodMeta.targets.calories, unit: 'cal', icon: 'Flame', color: 'text-error' },
					{ label: 'Protein', value: plan.nutritional_summary.daily_avg_protein, target: moodMeta.targets.protein, unit: 'g', icon: 'Drumstick', color: 'text-primary' },
					{ label: 'Carbs', value: plan.nutritional_summary.daily_avg_carbs, target: moodMeta.targets.carbs, unit: 'g', icon: 'Wheat', color: 'text-warning' },
					{ label: 'Fat', value: plan.nutritional_summary.daily_avg_fat, target: moodMeta.targets.fat, unit: 'g', icon: 'Droplets', color: 'text-info' }
				]
			: []
	);

	const peopleNote = $derived(
		mealPlan.lastInputs?.people_count ? `Averages shown are per person for a household of ${mealPlan.lastInputs.people_count}.` : 'Averages shown are per person.'
	);
</script>

<svelte:head>
	<title>Nutrition - MealinBudget</title>
</svelte:head>

{#if !plan}
	<div class="text-center py-20 space-y-4 font-display">
		<span class="flex mx-auto h-20 w-20 items-center justify-center rounded-3xl bg-accent/15 text-4xl">📊</span>
		<p class="font-display text-xl font-extrabold">No nutrition yet</p>
		<p class="text-sm text-base-content/50 -mt-1">Generate a plan and we'll break down the numbers.</p>
		<a href="/generate" class="btn btn-primary btn-lg rounded-full px-8 gap-2 shadow-lg shadow-primary/25 mt-2">
			<Icon name="Sparkles" size={18} />
			Make my menu
		</a>
	</div>
{:else}
	<div class="space-y-5 font-display">
		<div class="text-center">
			<span class="text-3xl leading-none">📊</span>
			<h1 class="font-display text-2xl font-extrabold leading-tight mt-1">Weekly nutrition</h1>
			<p class="text-xs text-base-content/50 mt-1">{peopleNote}</p>
		</div>

		<div class="rounded-3xl bg-sunset p-5 text-white shadow-lg shadow-primary/20 text-center">
			<span class="inline-flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wide">
				Daily average
				<span class="text-lg leading-none">🔥</span>
			</span>
			<div class="flex items-baseline justify-center gap-1 mt-1">
				<span class="font-display text-4xl font-extrabold tabular-nums">{plan.nutritional_summary.daily_avg_calories}</span>
				<span class="text-white/70 text-sm font-medium">cal</span>
			</div>
			<div class="flex flex-wrap justify-center gap-2 mt-3">
				<span class="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold">🍗 {plan.nutritional_summary.daily_avg_protein}g protein</span>
				<span class="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold">🌾 {plan.nutritional_summary.daily_avg_carbs}g carbs</span>
				<span class="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold">💧 {plan.nutritional_summary.daily_avg_fat}g fat</span>
			</div>
		</div>

		<div class="rounded-3xl bg-base-100 card-lift">
			<div class="p-5">
				<h2 class="font-display font-bold text-center">Daily average vs {moodMeta.emoji} {moodMeta.label}</h2>
				<div class="grid grid-cols-2 gap-5 pt-4">
					{#each progress as stat (stat.label)}
						{@const pct = Math.min(Math.round((stat.value / stat.target) * 100), 100)}
						<div class="flex flex-col items-center gap-1.5">
							<div
								class="radial-progress {stat.color}"
								style="--value: {pct}; --size: 5.5rem; --thickness: 6px;"
								role="progressbar"
								aria-valuenow={pct}
								aria-valuemin="0"
								aria-valuemax="100"
							>
								<span class="text-sm font-bold font-display">{pct}%</span>
							</div>
							<span class="inline-flex items-center gap-1 text-sm font-medium">
								<Icon name={stat.icon} size={15} class={stat.color} />
								{stat.label}
							</span>
							<span class="text-xs text-base-content/60">
								{stat.value}{stat.unit} / {stat.target}{stat.unit}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div>
			<h2 class="font-display text-lg font-bold text-center mb-3">Daily average</h2>
			<div class="grid grid-cols-2 gap-3">
				{#each daily as stat (stat.label)}
					<div class="rounded-3xl bg-base-100 card-lift p-4 flex flex-col items-center text-center">
						<span class="flex h-10 w-10 items-center justify-center rounded-2xl {stat.tile}">
							<Icon name={stat.icon} size={18} />
						</span>
						<p class="font-display text-2xl font-bold mt-2">
							{stat.value}<span class="text-sm font-normal text-base-content/60">{stat.unit}</span>
						</p>
						<span class="text-xs text-base-content/50">{stat.label}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-3xl bg-base-100 card-lift">
			<div class="p-4 space-y-2.5 text-center">
				<h2 class="font-display font-bold">Weekly total</h2>
				<div class="flex flex-wrap justify-center gap-x-4 gap-y-2">
					{#each daily as stat (stat.label)}
						<span class="inline-flex items-center gap-1.5 text-sm">
							<Icon name={stat.icon} size={15} class={stat.color} />
							<span class="text-base-content/70">{stat.label}</span>
							<span class="font-bold">{stat.value * 7}{stat.unit}</span>
						</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
