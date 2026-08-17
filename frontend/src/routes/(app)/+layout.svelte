<script lang="ts">
	let { children } = $props();
</script>

<div class="h-dvh flex flex-col bg-base-100">
	<header class="shrink-0 sticky top-0 z-30 bg-base-100/85 backdrop-blur border-b border-base-300/60">
		<div class="mx-auto max-w-lg navbar px-4">
			<div class="flex-1">
				<a href="/" class="inline-flex items-center gap-2">
					<img src="/logo_name.png" alt="MealinBudget" class="h-7 w-auto" />
				</a>
			</div>
		</div>
	</header>

	<main class="flex-1 overflow-y-auto mx-auto max-w-lg w-full px-4 py-5">
		{@render children()}
	</main>
</div>
