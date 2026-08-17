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

	const aisleColors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-warning'];

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
	<div class="text-center py-16 space-y-4">
		<span class="flex mx-auto h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
			<Icon name="ShoppingCart" size={28} />
		</span>
		<p class="font-medium">No meal plan yet.</p>
		<p class="text-sm text-base-content/60 -mt-2">Generate a plan to get your shopping list.</p>
		<a href="/generate" class="btn btn-primary gap-1.5">
			<Icon name="Sparkles" size={16} />
			Generate a plan
		</a>
	</div>
{:else}
	<div class="space-y-5">
		<div class="hidden print:block text-center mb-4">
			<h1 class="text-xl font-bold">MealinBudget Shopping List</h1>
			<p class="text-sm">Week of {plan.week_start_date} · Estimated total ₹{totalMin}-{totalMax}</p>
			<hr class="my-3" />
		</div>

		<div class="flex items-center justify-between print:hidden">
			<div>
				<h1 class="font-display text-2xl font-extrabold">Shopping List</h1>
				<p class="text-sm text-base-content/60 mt-0.5">Week of {plan.week_start_date}</p>
			</div>
			<span class="badge badge-outline badge-lg border-base-300">{purchased.length}/{totalItems} done</span>
		</div>

		<div class="alert alert-info text-sm print:hidden shadow-sm">
			<Icon name="Wallet" size={20} />
			<span>💰 Estimated total: ₹{totalMin}-{totalMax}</span>
		</div>

		<div class="card bg-base-100 shadow-sm print:hidden">
			<div class="card-body p-4 space-y-2">
				<div class="flex justify-between text-xs text-base-content/70">
					<span>Shopping progress</span>
					<span class="font-semibold">{purchasedPct}%</span>
				</div>
				<progress class="progress progress-success w-full" value={purchased.length} max={Math.max(totalItems, 1)}></progress>
			</div>
		</div>

		{#each plan.shopping_list as category, ci (category.category)}
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-4">
					<h2 class="font-semibold inline-flex items-center gap-2">
						<span class="h-2.5 w-2.5 rounded-full {aisleColors[ci % aisleColors.length]}"></span>
						{category.category}
						<span class="badge badge-ghost badge-sm">{category.items.length}</span>
					</h2>
					<ul class="divide-y divide-base-300/70">
						{#each category.items as item}
							{@const key = itemKey(category.category, item.name)}
							{@const done = purchased.includes(key)}
							<li class="py-2.5">
								<div class="flex items-center gap-2">
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
									<span class="text-xs font-medium text-base-content/60 whitespace-nowrap">
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

		<div class="fixed bottom-5 inset-x-0 z-20 print:hidden">
			<div class="mx-auto max-w-lg px-4">
				<div class="join w-full shadow-lg shadow-primary/20">
					<button class="btn btn-outline join-item flex-1 gap-1.5 border-base-300" onclick={() => window.print()}>
						<Icon name="Printer" size={18} />
						Print
					</button>
					<button class="btn btn-primary join-item flex-1 gap-1.5" onclick={share}>
						<Icon name="Share2" size={18} />
						Share / Download
					</button>
				</div>
			</div>
		</div>

		<div class="h-28 print:hidden"></div>
	</div>
{/if}