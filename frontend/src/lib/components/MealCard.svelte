<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons.js';
	import type { Meal, MealType } from '$lib/types/index.js';

	interface Props {
		meal: Meal;
		onclick?: () => void;
	}

	let { meal, onclick }: Props = $props();

	let imgFailed = $state(false);

	$effect(() => {
		imgFailed = false;
	});

	const typeMeta: Record<MealType, { icon: IconName; emoji: string; tile: string; label: string }> = {
		breakfast: { icon: 'Sunrise', emoji: '🌅', tile: 'bg-secondary/20', label: 'Breakfast' },
		lunch: { icon: 'Sun', emoji: '☀️', tile: 'bg-accent/20', label: 'Lunch' },
		dinner: { icon: 'Moon', emoji: '🌙', tile: 'bg-primary/12', label: 'Dinner' }
	};
</script>

<div
	class="rounded-3xl bg-base-100 card-lift cursor-pointer overflow-hidden font-display"
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
	{#if meal.image_url && !imgFailed}
		<div class="relative h-32 w-full overflow-hidden">
			<img
				src={meal.image_url}
				alt={meal.meal_name}
				class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
				loading="lazy"
				onerror={() => (imgFailed = true)}
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"></div>
			<span class="absolute left-3 top-3 badge badge-ghost border-0 bg-black/35 text-white backdrop-blur-sm gap-1">
				<Icon name={typeMeta[meal.meal_type].icon} size={12} />
				{typeMeta[meal.meal_type].label}
			</span>
		</div>
	{:else}
		<div class="relative flex h-32 w-full items-center justify-center {typeMeta[meal.meal_type].tile}">
			<span class="text-5xl drop-shadow-sm">{typeMeta[meal.meal_type].emoji}</span>
			<span class="absolute left-3 top-3 badge badge-ghost border-0 bg-white/70 text-base-content/70 backdrop-blur-sm gap-1">
				<Icon name={typeMeta[meal.meal_type].icon} size={12} />
				{typeMeta[meal.meal_type].label}
			</span>
		</div>
	{/if}
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<h3 class="font-bold leading-tight truncate">{meal.meal_name}</h3>
			<p class="text-xs text-base-content/50 mt-1 inline-flex items-center gap-1.5">
				<span class="inline-flex items-center gap-0.5">
					<Icon name="Clock" size={11} />
					{meal.cooking_time_mins} min
				</span>
				<span class="opacity-40">·</span>
				{meal.cuisine}
			</p>
		</div>
		<span class="shrink-0 rounded-2xl bg-primary/10 ring-1 ring-primary/10 px-3 py-2 text-center">
			<span class="block font-extrabold leading-none text-primary">
				{meal.nutritional_info.calories}
			</span>
			<span class="block text-[10px] text-base-content/50 mt-0.5">cal</span>
		</span>
	</div>
</div>