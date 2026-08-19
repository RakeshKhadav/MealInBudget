<script lang="ts">
	import { mealPlan } from '$lib/stores/mealPlan.svelte.js';
	import { getPurchased, setPurchasedItem } from '$lib/db/local.js';
	import { browser } from '$app/environment';
	import Icon from '$lib/components/Icon.svelte';

	const plan = $derived(mealPlan.current);

	let purchased = $state<string[]>([]);

	$effect(() => {
		if (!plan) return;
		getPurchased(plan.meal_plan_id).then((keys) => (purchased = keys));
	});

	function itemKey(category: string, name: string): string {
		return `${category}|${name}`;
	}

	function suffix(n: number): string {
		return n === 1 ? '' : 's';
	}

	async function toggle(category: string, name: string) {
		if (!plan) return;
		const key = itemKey(category, name);
		const isPurchased = !purchased.includes(key);
		purchased = isPurchased ? [...purchased, key] : purchased.filter((k) => k !== key);
		await setPurchasedItem(plan.meal_plan_id, key, isPurchased);
	}

	const totalMin = $derived(
		(plan?.shopping_list ?? []).reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.est_price_min, 0), 0)
	);
	const totalMax = $derived(
		(plan?.shopping_list ?? []).reduce((acc, cat) => acc + cat.items.reduce((s, i) => s + i.est_price_max, 0), 0)
	);
	const totalItems = $derived(
		(plan?.shopping_list ?? []).reduce((acc, cat) => acc + cat.items.length, 0)
	);
	const purchasedPct = $derived(totalItems > 0 ? Math.round((purchased.length / totalItems) * 100) : 0);

	const aisleEmojis = ['🥬', '🥩', '🥛', '🍞', '🧺'];

	function buildText(): string {
		if (!plan) return '';
		const lines: string[] = [];
		lines.push('MealinBudget Shopping List');
		lines.push(`Week: ${plan.week_start_date} - ${plan.week_end_date}`);
		lines.push('--------------------------------');
		for (const cat of plan.shopping_list) {
			lines.push(`\n${cat.category}`);
			for (const item of cat.items) {
				const done = purchased.includes(itemKey(cat.category, item.name)) ? '[x]' : '[ ]';
				lines.push(`${done} ${item.name} ${item.qty}${item.unit} (₹${item.est_price_min}-${item.est_price_max})`);
			}
		}
		lines.push('\n--------------------------------');
		lines.push(`Total estimated: ₹${totalMin}-${totalMax}`);
		return lines.join('\n');
	}

	async function downloadText() {
		const blob = new Blob([buildText()], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'mealinbudget-shopping-list.txt';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function share() {
		if (browser && navigator.share) {
			try {
				await navigator.share({ title: 'MealinBudget Shopping List', text: buildText() });
				return;
			} catch {
				// fall through to download
			}
		}
		await downloadText();
	}
</script>

<svelte:head>
	<title>Shopping List - MealinBudget</title>
</svelte:head>

{#if !plan}
	<div class="text-center py-20 space-y-4 font-display">
		<span class="flex mx-auto h-20 w-20 items-center justify-center rounded-3xl bg-secondary/15 text-4xl">🛒</span>
		<p class="font-display text-xl font-extrabold">No list yet</p>
		<p class="text-sm text-base-content/50 -mt-1">Generate a plan and we'll prep your shopping list.</p>
		<a href="/generate" class="btn btn-primary btn-lg rounded-full px-8 gap-2 shadow-lg shadow-primary/25 mt-2">
			<Icon name="Sparkles" size={18} />
			Make my menu
		</a>
	</div>
{:else}
	<div class="space-y-5 font-display">
		<div class="hidden print:block text-center mb-4">
			<h1 class="text-xl font-bold">MealinBudget Shopping List</h1>
			<p class="text-sm">Week of {plan.week_start_date} · Estimated total ₹{totalMin}-{totalMax}</p>
			<hr class="my-3" />
		</div>

		<div class="text-center print:hidden">
			<span class="text-3xl leading-none">🛒</span>
			<h1 class="font-display text-2xl font-extrabold leading-tight mt-1">Shopping list</h1>
			<p class="text-xs text-base-content/50 mt-1">Week of {plan.week_start_date}</p>
		</div>

		<div class="rounded-3xl bg-sunset p-5 text-white shadow-lg shadow-primary/20 text-center print:hidden">
			<span class="inline-flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wide">
				Estimated total
				<span class="text-lg leading-none">💰</span>
			</span>
			<div class="flex items-baseline justify-center gap-1 mt-1">
				<span class="font-display text-4xl font-extrabold tabular-nums">₹{totalMin}-{totalMax}</span>
			</div>
			<progress
				class="progress progress-success w-full mt-4 [&::-moz-progress-bar]:bg-white [&::-webkit-progress-bar]:bg-white/20 [&::-webkit-progress-value]:bg-white rounded-full"
				value={purchased.length}
				max={Math.max(totalItems, 1)}
			></progress>
			<p class="text-white/80 text-xs font-semibold mt-2">{purchasedPct}% done · {purchased.length}/{totalItems} items</p>
		</div>

		{#each plan.shopping_list as category, ci (category.category)}
			<div class="rounded-3xl bg-base-100 card-lift">
				<div class="p-4">
					<h2 class="font-display font-bold text-center inline-flex items-center justify-center gap-2 w-full">
						<span class="text-xl leading-none">{aisleEmojis[ci % aisleEmojis.length]}</span>
						{category.category}
						<span class="badge badge-ghost badge-sm">{category.items.length}</span>
					</h2>
					<ul class="divide-y divide-base-300/70 mt-3">
						{#each category.items as item}
							{@const key = itemKey(category.category, item.name)}
							{@const done = purchased.includes(key)}
							<li class="py-2.5">
								<div class="flex items-center gap-2.5">
									<input
										type="checkbox"
										class="checkbox checkbox-primary checkbox-sm rounded-md"
										checked={done}
										onchange={() => toggle(category.category, item.name)}
									/>
									<span class="flex-1 {done ? 'line-through text-base-content/40' : ''}">
										{item.name}
										<span class="text-xs text-base-content/60">· {item.qty}{item.unit}</span>
									</span>
									<span class="rounded-xl bg-primary/10 px-2 py-1 text-xs font-semibold text-primary whitespace-nowrap">
										₹{item.est_price_min}-{item.est_price_max}
									</span>
								</div>
								{#if item.used_in.length > 0}
									<details class="collapse collapse-arrow mt-1.5 print:hidden">
										<summary class="collapse-title text-xs text-base-content/60 min-h-0 p-0 pl-8">
											Used in {item.used_in.length} meal{suffix(item.used_in.length)}
										</summary>
										<div class="collapse-content text-xs text-base-content/70 p-0 pl-8 pt-1">
											{item.used_in.map((u) => u.charAt(0).toUpperCase() + u.slice(1)).join(' · ')}
										</div>
									</details>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/each}

		<div class="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] inset-x-0 z-20 print:hidden">
			<div class="mx-auto max-w-lg px-4 flex gap-2">
				<button
					class="btn btn-lg flex-1 rounded-full gap-1.5 bg-base-200 hover:bg-base-300 border-0"
					onclick={() => window.print()}
				>
					<Icon name="Printer" size={18} />
					Print
				</button>
				<button class="btn btn-primary btn-lg flex-1 rounded-full gap-1.5 shadow-lg shadow-primary/25" onclick={share}>
					<Icon name="Share2" size={18} />
					Share / Download
				</button>
			</div>
		</div>

		<div class="h-40 print:hidden"></div>
	</div>
{/if}
