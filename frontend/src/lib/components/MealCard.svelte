<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons.js';
	import type { Meal, MealType } from '$lib/types/index.js';

	interface Props {
		meal: Meal;
		onclick?: () => void;
	}

	let { meal, onclick }: Props = $props();

	const typeMeta: Record<MealType, { icon: IconName; tile: string; bar: string; label: string }> = {
		breakfast: { icon: 'Sunrise', tile: 'bg-secondary/20 text-secondary-content', bar: 'bg-secondary', label: 'Breakfast' },
		lunch: { icon: 'Sun', tile: 'bg-accent/20 text-accent-content', bar: 'bg-accent', label: 'Lunch' },
		dinner: { icon: 'Moon', tile: 'bg-primary/15 text-primary', bar: 'bg-primary', label: 'Dinner' }
	};

	const difficultyClass = $derived(
		meal.difficulty.toLowerCase().includes('easy')
			? 'badge-success'
			: meal.difficulty.toLowerCase().includes('hard')
				? 'badge-error'
				: 'badge-warning'
	);
</script>

<div
	class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
	role="button"
	tabindex="0"
	onclick={onclick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick?.();
		}
	}}
>
	<div class="h-1 {typeMeta[meal.meal_type].bar}"></div>
	<div class="card-body p-4">
		<div class="flex justify-between items-start gap-2">
			<div class="flex items-center gap-2.5">
				<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {typeMeta[meal.meal_type].tile}">
					<Icon name={typeMeta[meal.meal_type].icon} size={20} />
				</span>
				<div>
					<h3 class="font-display font-semibold leading-tight">{meal.meal_name}</h3>
					<p class="text-xs text-base-content/60">
						{typeMeta[meal.meal_type].label} · {meal.cuisine}
					</p>
				</div>
			</div>
			<div class="flex flex-col items-end gap-1 shrink-0">
				<span class="badge badge-ghost badge-sm gap-1">
					<Icon name="Clock" size={12} />
					{meal.cooking_time_mins} min
				</span>
				<span class="badge {difficultyClass} badge-sm">{meal.difficulty}</span>
			</div>
		</div>
		<div class="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-base-content/70 mt-1.5 border-t border-base-300 pt-2.5">
			<span class="inline-flex items-center gap-1">
				<Icon name="Flame" size={13} class="text-error/70" />
				{meal.nutritional_info.calories} cal
			</span>
			<span class="inline-flex items-center gap-1">
				<Icon name="Drumstick" size={13} class="text-primary/70" />
				{meal.nutritional_info.protein_g}g protein
			</span>
			<span class="inline-flex items-center gap-1">
				<Icon name="Wheat" size={13} class="text-warning/70" />
				{meal.nutritional_info.carbs_g}g carbs
			</span>
			<span class="inline-flex items-center gap-1">
				<Icon name="Droplets" size={13} class="text-info/70" />
				{meal.nutritional_info.fat_g}g fat
			</span>
		</div>
	</div>
</div>