<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import Icon from '$lib/components/Icon.svelte';
	import { api } from '$lib/services/api.js';
	import { mealPlan } from '$lib/stores/mealPlan.svelte.js';
	import {
		APPLIANCE_OPTIONS,
		DIETARY_OPTIONS,
		MOODS,
		type Appliance,
		type DietaryRestriction,
		type GenerateRequest,
		type Mood
	} from '$lib/types/index.js';

	const VEG_VALUES = ['vegetarian', 'non_vegetarian'] as const;
	const VEG_OPTIONS = [
		{ value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
		{ value: 'non_vegetarian', label: 'Non-veg', emoji: '🍗' }
	] as const;
	const OTHER_DIETARY = DIETARY_OPTIONS.filter(
		(o) => !(VEG_VALUES as readonly string[]).includes(o.value)
	).map((o) => ({
		...o,
		emoji:
			o.value === 'no_onions'
				? '🧅'
				: o.value === 'no_garlic'
					? '🧄'
					: o.value === 'no_dairy'
						? '🥛'
						: o.value === 'gluten_free'
							? '🌾'
							: '🥚'
	}));
	const QUESTIONS = [
		'What is your weekly budget?',
		'How many people are you feeding?',
		'Vegetarian, non-veg, or both?',
		'What kind of week are you after?',
		'Any dietary restrictions?',
		'What can you cook with?',
		'All set?'
	];

	let budget = $state(2000);
	let people = $state(4);
	let dietary = $state<DietaryRestriction[]>(['vegetarian']);
	let moods = $state<Mood[]>([]);
	let appliances = $state<Appliance[]>([]);
	let step = $state(0);
	let direction = $state(1);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let offline = $state(false);

	$effect(() => {
		if (!browser) return;
		const on = () => (offline = false);
		const off = () => (offline = true);
		offline = !navigator.onLine;
		window.addEventListener('online', on);
		window.addEventListener('offline', off);
		return () => {
			window.removeEventListener('online', on);
			window.removeEventListener('offline', off);
		};
	});

	$effect(() => {
		const last = mealPlan.lastInputs;
		if (last && page.url.searchParams.get('use') === 'last') {
			budget = last.budget;
			people = last.people_count;
			dietary = [...last.dietary_restrictions];
			moods = [...last.moods];
			appliances = [...last.appliances];
		}
	});

	const stepValid = $derived.by(() => {
		switch (step) {
			case 2:
				return dietary.some((d) => (VEG_VALUES as readonly string[]).includes(d));
			case 3:
				return moods.length > 0;
			case 5:
				return appliances.length > 0;
			default:
				return true;
		}
	});

	const selectedVegLabels = $derived(
		VEG_OPTIONS.filter((o) => dietary.includes(o.value)).map((o) => o.label)
	);
	const selectedOtherDietary = $derived(OTHER_DIETARY.filter((o) => dietary.includes(o.value)));
	const selectedMoodLabels = $derived(MOODS.filter((m) => moods.includes(m.value)));
	const selectedApplianceLabels = $derived(
		APPLIANCE_OPTIONS.filter((a) => appliances.includes(a.value))
	);

	function toggleDiet(value: DietaryRestriction) {
		dietary = dietary.includes(value) ? dietary.filter((d) => d !== value) : [...dietary, value];
	}

	function toggleMood(value: Mood) {
		moods = moods.includes(value) ? moods.filter((m) => m !== value) : [...moods, value];
	}

	function toggleAppliance(value: Appliance) {
		appliances = appliances.includes(value)
			? appliances.filter((a) => a !== value)
			: [...appliances, value];
	}

	function next() {
		if (!stepValid || loading) return;
		if (step < QUESTIONS.length - 1) {
			direction = 1;
			step += 1;
		} else {
			generate();
		}
	}

	function back() {
		direction = -1;
		if (step > 0) step -= 1;
		else goto('/');
	}

	function goToStep(i: number) {
		direction = i > step ? 1 : -1;
		step = i;
	}

	function onPeopleInput(e: Event) {
		const raw = Number((e.currentTarget as HTMLInputElement).value);
		people = Number.isNaN(raw) ? people : Math.min(6, Math.max(1, Math.round(raw)));
	}

	async function generate() {
		loading = true;
		error = null;
		try {
			const input: GenerateRequest = {
				budget,
				people_count: people,
				moods: [...moods],
				dietary_restrictions: [...dietary],
				appliances: [...appliances]
			};
			const plan = await api.generate(input);
			await mealPlan.setPlan(plan, input);
			await goto('/meal-plan');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to generate meal plan';
			loading = false;
		}
	}

	function isVegSelected(value: (typeof VEG_OPTIONS)[number]['value']) {
		return dietary.includes(value);
	}
</script>

<svelte:head>
	<title>Generate Meal Plan - MealinBudget</title>
</svelte:head>

<div class="flex flex-col min-h-[calc(100dvh-8.5rem)]">
	<div class="flex items-center gap-3">
		<button
			class="btn btn-circle btn-ghost btn-sm shrink-0 -ml-2 text-base-content/60"
			onclick={back}
			aria-label="Back"
		>
			<Icon name="ChevronLeft" size={22} />
		</button>
		<div class="flex items-center gap-1.5">
			{#each QUESTIONS as _, i (i)}
				<span
					class="h-1.5 rounded-full transition-all {i === step
						? 'w-6 bg-primary'
						: i < step
							? 'w-1.5 bg-primary/40'
							: 'w-1.5 bg-base-300'}"
				></span>
			{/each}
		</div>
	</div>

	{#key step}
		<div class="mt-8 flex-1 {direction > 0 ? 'anim-fwd' : 'anim-back'}">
			<h1 class="font-display text-3xl font-extrabold leading-tight">{QUESTIONS[step]}</h1>

			<div class="mt-8">
				{#if step === 0}
					<div>
						<div class="text-center">
							<span class="font-display text-6xl font-extrabold text-primary tabular-nums"
								>₹{budget.toLocaleString('en-IN')}</span
							>
							<p class="text-xs text-base-content/50 mt-1">per week</p>
						</div>
						<input
							type="range"
							class="range range-primary range-lg mt-10 w-full"
							min="500"
							max="5000"
							step="100"
							bind:value={budget}
							aria-label="Weekly budget"
						/>
						<div class="flex justify-between px-1 mt-2 text-xs text-base-content/60 tabular-nums">
							<span>₹500</span>
							<span>₹2,750</span>
							<span>₹5,000</span>
						</div>
					</div>
				{:else if step === 1}
					<div class="flex items-center justify-center gap-6">
						<button
							class="btn btn-circle btn-lg bg-base-100 border border-base-300/60 shadow-sm text-3xl font-bold text-primary"
							onclick={() => (people = Math.max(1, people - 1))}
							aria-label="Fewer people"
						>
							−
						</button>
						<input
							type="number"
							class="counter-input w-28 bg-transparent text-center font-display text-7xl font-extrabold text-base-content outline-none"
							value={people}
							oninput={onPeopleInput}
							min="1"
							max="6"
							aria-label="Number of people"
						/>
						<button
							class="btn btn-circle btn-lg bg-base-100 border border-base-300/60 shadow-sm text-3xl font-bold text-primary"
							onclick={() => (people = Math.min(6, people + 1))}
							aria-label="More people"
						>
							+
						</button>
					</div>
					<p class="text-center text-sm text-base-content/50 mt-4">
						{people} {people === 1 ? 'person' : 'people'} every day
					</p>
				{:else if step === 2}
					<div class="grid grid-cols-2 gap-3">
						{#each VEG_OPTIONS as opt (opt.value)}
							<button
								type="button"
								class="rounded-3xl p-5 text-center transition-all {isVegSelected(opt.value)
									? 'bg-primary/10 ring-2 ring-primary'
									: 'bg-base-200/60 hover:bg-base-200'}"
								onclick={() => toggleDiet(opt.value)}
								aria-pressed={isVegSelected(opt.value)}
							>
								<span class="text-4xl leading-none">{opt.emoji}</span>
								<span class="block font-display text-lg font-bold mt-2">{opt.label}</span>
							</button>
						{/each}
					</div>
					<p class="text-center text-sm text-base-content/50 mt-4">
						Pick both for a mix of veg and non-veg meals
					</p>
				{:else if step === 3}
					<div class="grid grid-cols-2 gap-3">
						{#each MOODS as m (m.value)}
							<button
								type="button"
								class="rounded-3xl p-4 text-left transition-all {moods.includes(m.value)
									? 'bg-primary/10 ring-2 ring-primary'
									: 'bg-base-200/60 hover:bg-base-200'}"
								onclick={() => toggleMood(m.value)}
								aria-pressed={moods.includes(m.value)}
							>
								<span class="text-3xl leading-none">{m.emoji}</span>
								<span class="block font-display text-base font-bold mt-2">{m.label}</span>
							</button>
{/each}
				</div>
				<div class="flex justify-center mt-6">
					<button
						class="btn btn-primary btn-xl gap-2 px-8 rounded-full shadow-lg shadow-primary/25"
						disabled={!stepValid || offline}
						onclick={next}
					>
						Continue
						<Icon name="ArrowRight" size={20} />
					</button>
				</div>
			{:else if step === 4}
				<div class="grid grid-cols-2 gap-3">
					{#each OTHER_DIETARY as opt (opt.value)}
						<button
							type="button"
							class="rounded-3xl p-4 text-center transition-all {dietary.includes(opt.value)
								? 'bg-primary/10 ring-2 ring-primary'
								: 'bg-base-200/60 hover:bg-base-200'}"
							onclick={() => toggleDiet(opt.value)}
							aria-pressed={dietary.includes(opt.value)}
						>
							<span class="text-4xl leading-none">{opt.emoji}</span>
							<span class="block font-display text-base font-bold mt-2">{opt.label}</span>
						</button>
					{/each}
				</div>
<p class="text-sm text-base-content/50 mt-4">Only pick what matters — none is fine.</p>
					<div class="flex justify-center mt-6">
						<button
							class="btn btn-primary btn-xl gap-2 px-8 rounded-full shadow-lg shadow-primary/25"
							disabled={!stepValid || offline}
							onclick={next}
						>
							Continue
							<Icon name="ArrowRight" size={20} />
						</button>
					</div>
				{:else if step === 5}
				<div class="grid grid-cols-2 gap-3">
					{#each APPLIANCE_OPTIONS as opt (opt.value)}
						<button
							type="button"
							class="rounded-3xl p-4 text-center transition-all {appliances.includes(opt.value)
								? 'bg-secondary/15 ring-2 ring-secondary'
								: 'bg-base-200/60 hover:bg-base-200'}"
							onclick={() => toggleAppliance(opt.value)}
							aria-pressed={appliances.includes(opt.value)}
						>
							<span
								class="inline-flex h-12 w-12 items-center justify-center rounded-2xl {appliances.includes(opt.value)
									? 'bg-secondary/25 text-secondary-content'
									: 'bg-base-100 text-base-content/60'}"
							>
								<Icon name={opt.icon} size={24} />
							</span>
							<span class="block font-display text-base font-bold mt-2">{opt.label}</span>
						</button>
{/each}
				</div>
				<div class="flex justify-center mt-6">
					<button
						class="btn btn-primary btn-xl gap-2 px-8 rounded-full shadow-lg shadow-primary/25"
						disabled={!stepValid || offline}
						onclick={next}
					>
						Continue
						<Icon name="ArrowRight" size={20} />
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-3">
					<button
						type="button"
						class="h-24 rounded-3xl bg-primary/10 p-3 flex flex-col justify-between text-left shadow-sm transition-transform active:scale-[0.97]"
						onclick={() => goToStep(0)}
					>
						<span class="flex w-full items-center gap-1.5">
							<span class="text-lg leading-none">💸</span>
							<span class="text-[10px] text-base-content/50">Budget</span>
							<Icon name="ChevronRight" size={14} class="ml-auto text-base-content/30" />
						</span>
						<span class="block font-display text-sm font-bold leading-snug line-clamp-2"
							>₹{budget.toLocaleString('en-IN')}</span
						>
					</button>
					<button
						type="button"
						class="h-24 rounded-3xl bg-secondary/15 p-3 flex flex-col justify-between text-left shadow-sm transition-transform active:scale-[0.97]"
						onclick={() => goToStep(1)}
					>
						<span class="flex w-full items-center gap-1.5">
							<span class="text-lg leading-none">👨‍👩‍👧‍👦</span>
							<span class="text-[10px] text-base-content/50">People</span>
							<Icon name="ChevronRight" size={14} class="ml-auto text-base-content/30" />
						</span>
						<span class="block font-display text-sm font-bold leading-snug line-clamp-2"
							>{people} {people === 1 ? 'person' : 'people'}</span
						>
					</button>
					<button
						type="button"
						class="h-24 rounded-3xl bg-accent/20 p-3 flex flex-col justify-between text-left shadow-sm transition-transform active:scale-[0.97]"
						onclick={() => goToStep(2)}
					>
						<span class="flex w-full items-center gap-1.5">
							<span class="text-lg leading-none">🥗</span>
							<span class="text-[10px] text-base-content/50">Diet</span>
							<Icon name="ChevronRight" size={14} class="ml-auto text-base-content/30" />
						</span>
						<span class="block font-display text-sm font-bold leading-snug line-clamp-2"
							>{selectedVegLabels.join(' + ') || 'Not chosen'}</span
						>
					</button>
					<button
						type="button"
						class="h-24 rounded-3xl bg-primary/10 p-3 flex flex-col justify-between text-left shadow-sm transition-transform active:scale-[0.97]"
						onclick={() => goToStep(3)}
					>
						<span class="flex w-full items-center gap-1.5">
							<span class="text-lg leading-none">🌶️</span>
							<span class="text-[10px] text-base-content/50">Week style</span>
							<Icon name="ChevronRight" size={14} class="ml-auto text-base-content/30" />
						</span>
						<span class="block font-display text-sm font-bold leading-snug line-clamp-2"
							>{selectedMoodLabels.map((m) => m.label).join(', ')}</span
						>
					</button>
					<button
						type="button"
						class="h-24 rounded-3xl bg-secondary/15 p-3 flex flex-col justify-between text-left shadow-sm transition-transform active:scale-[0.97]"
						onclick={() => goToStep(4)}
					>
						<span class="flex w-full items-center gap-1.5">
							<span class="text-lg leading-none">🚫</span>
							<span class="text-[10px] text-base-content/50">Restrictions</span>
							<Icon name="ChevronRight" size={14} class="ml-auto text-base-content/30" />
						</span>
						<span class="block font-display text-sm font-bold leading-snug line-clamp-2"
							>{selectedOtherDietary.length > 0
								? selectedOtherDietary.map((d) => d.label).join(', ')
								: 'None'}</span
						>
					</button>
					<button
						type="button"
						class="h-24 rounded-3xl bg-accent/20 p-3 flex flex-col justify-between text-left shadow-sm transition-transform active:scale-[0.97]"
						onclick={() => goToStep(5)}
					>
						<span class="flex w-full items-center gap-1.5">
							<span class="text-lg leading-none">🍳</span>
							<span class="text-[10px] text-base-content/50">Appliances</span>
							<Icon name="ChevronRight" size={14} class="ml-auto text-base-content/30" />
						</span>
						<span class="block font-display text-sm font-bold leading-snug line-clamp-2"
							>{selectedApplianceLabels.length > 0
								? selectedApplianceLabels.map((a) => a.label).join(', ')
								: 'None'}</span
						>
					</button>
				</div>
				<div class="flex justify-center mt-6">
					<button
						class="btn btn-primary btn-xl gap-2 px-8 rounded-full ring-2 ring-primary/60 shadow-[0_0_18px_4px] shadow-primary/40"
						disabled={offline}
						onclick={next}
					>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{:else}
							<Icon name="Sparkles" size={20} />
						{/if}
						Generate plan
					</button>
				</div>
			{/if}

			{#if error}
					<div class="alert alert-error text-sm shadow-sm mt-6">
						<Icon name="CircleAlert" size={20} />
						<span>{error}</span>
					</div>
				{/if}
				{#if offline}
					<div class="alert alert-warning text-sm shadow-sm mt-3">
						<Icon name="WifiOff" size={20} />
						<span>You're offline — generating needs internet. Saved plans still work.</span>
					</div>
				{/if}
			</div>
		</div>
	{/key}

	<div class="h-24"></div>
</div>

{#if step < 3}
	<div class="fixed bottom-[20vh] inset-x-0 z-20">
		<div class="mx-auto max-w-lg px-4 flex justify-center">
			<button
				class="btn btn-primary btn-xl gap-2 px-8 rounded-full shadow-lg shadow-primary/25"
				disabled={!stepValid || offline}
				onclick={next}
			>
				Continue
				<Icon name="ArrowRight" size={20} />
			</button>
		</div>
	</div>
{/if}

<style>
	.anim-fwd {
		animation: slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.anim-back {
		animation: slide-in-back 260ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(28px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@keyframes slide-in-back {
		from {
			opacity: 0;
			transform: translateX(-28px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.counter-input {
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.counter-input::-webkit-outer-spin-button,
	.counter-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>




