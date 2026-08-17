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

	const goalStatus = $derived.by(() => {
		if (!plan) return null;
		const p = plan.nutritional_summary;
		const t = moodMeta.targets;
		if (mood === 'protein_packed') {
			const diff = p.daily_avg_protein - t.protein;
			return diff >= 0
				? `Your meals match your '${moodMeta.emoji} ${moodMeta.label}' goal perfectly!`
				: `Protein is ${Math.abs(diff)}g below your ${moodMeta.label} target (${t.protein}g).`;
		}
		if (mood === 'low_calorie') {
			const diff = p.daily_avg_calories - t.calories;
			return diff <= 0
				? `Your meals stay under your ${moodMeta.label} calorie target (${t.calories} cal).`
				: `Calories are ${diff} over your ${moodMeta.label} target (${t.calories} cal).`;
		}
		if (mood === 'budget_minimal') {
			return `Your meals are tuned for maximum value on a ${moodMeta.label} budget.`;
		}
		if (mood === 'quick_easy') {
			return `Your meals are designed to be ${moodMeta.label} — all under 30 mins.`;
		}
		return `Your meals are built for a ${moodMeta.emoji} ${moodMeta.label} week.`;
	});

	const goalPositive = $derived(!/below|over|miss/.test(goalStatus ?? ''));

	const peopleNote = $derived(
		mealPlan.lastInputs?.people_count ? `Averages shown are per person for a household of ${mealPlan.lastInputs.people_count}.` : 'Averages shown are per person.'
	);
</script>

<svelte:head>
	<title>Nutrition - MealinBudget</title>
</svelte:head>

{#if !plan}
	<div class="text-center py-16 space-y-4">
		<span class="flex mx-auto h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
			<Icon name="ChartColumn" size={28} />
		</span>
		<p class="font-medium">No meal plan yet.</p>
		<p class="text-sm text-base-content/60 -mt-2">Generate a plan to see nutrition breakdowns.</p>
		<a href="/generate" class="btn btn-primary gap-1.5">
			<Icon name="Sparkles" size={16} />
			Generate a plan
		</a>
	</div>
{:else}
	<div class="space-y-5">
		<div>
			<h1 class="font-display text-2xl font-extrabold inline-flex items-center gap-2">
				<Icon name="ChartColumn" size={22} class="text-primary" />
				Weekly Nutrition
			</h1>
			<p class="text-sm text-base-content/60 mt-1">{peopleNote}</p>
		</div>

		<div class="alert {goalPositive ? 'alert-success' : 'alert-warning'} text-sm shadow-sm">
			<Icon name={goalPositive ? 'CircleCheck' : 'CircleAlert'} size={20} />
			<span>{goalStatus}</span>
		</div>

		<div class="card bg-base-100 shadow-sm">
			<div class="card-body p-5">
				<h2 class="font-semibold mb-1">Daily Average vs {moodMeta.emoji} {moodMeta.label} Target</h2>
				<div class="grid grid-cols-2 gap-5 pt-2">
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
			<h2 class="text-lg font-semibold mb-3">Daily Average</h2>
			<div class="grid grid-cols-2 gap-3">
				{#each daily as stat (stat.label)}
					<div class="card bg-base-100 shadow-sm card-lift">
						<div class="card-body p-4">
							<div class="flex items-center gap-2 mb-1">
								<span class="flex h-8 w-8 items-center justify-center rounded-xl {stat.tile}">
									<Icon name={stat.icon} size={16} />
								</span>
								<span class="text-sm text-base-content/60">{stat.label}</span>
							</div>
							<p class="font-display text-2xl font-bold">
								{stat.value}<span class="text-sm font-normal text-base-content/60">{stat.unit}</span>
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="card bg-base-100 shadow-sm">
			<div class="card-body p-4 space-y-2.5">
				<h2 class="font-semibold">Weekly Total</h2>
				{#each daily as stat (stat.label)}
					<div class="flex items-center justify-between text-sm">
						<span class="inline-flex items-center gap-2 text-base-content/70">
							<Icon name={stat.icon} size={15} class={stat.color} />
							{stat.label}
						</span>
						<span class="font-semibold">{stat.value * 7}{stat.unit}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}