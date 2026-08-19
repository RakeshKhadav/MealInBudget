<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		open?: boolean;
		title?: string;
		onclose?: () => void;
		hero?: Snippet;
		children?: Snippet;
	}

	let { open = false, title, onclose, hero, children }: Props = $props();

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onclose?.();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<div class="modal modal-open modal-bottom sm:modal-middle">
		<div class="modal-backdrop" role="button" aria-label="Close dialog" tabindex="-1" onclick={() => onclose?.()} onkeydown={(e) => e.key === 'Enter' && onclose?.()}></div>
		<div class="modal-box max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-0 max-w-[26rem] w-full">
			{#if hero}
				<div class="relative">
					{@render hero()}
					<button
						class="btn btn-circle btn-sm absolute right-3 top-3 z-10 border-0 bg-black/35 text-white backdrop-blur hover:bg-black/50"
						onclick={onclose}
						aria-label="Close"
					>
						<Icon name="X" size={18} />
					</button>
				</div>
			{/if}
			<div class="p-5 font-display">
				{#if !hero && title}
					<div class="flex items-start justify-between gap-4">
						<h3 class="font-bold text-xl leading-tight">{title}</h3>
						<button class="btn btn-ghost btn-sm btn-circle shrink-0" onclick={onclose} aria-label="Close">
							<Icon name="X" size={18} />
						</button>
					</div>
				{/if}
				{#if hero && title}
					<h3 class="font-bold text-xl leading-tight">{title}</h3>
				{/if}
				<div class="pt-3">{#if children}{@render children()}{/if}</div>
				<div class="pt-4">
					<button class="btn btn-primary btn-lg rounded-full w-full gap-1.5" onclick={onclose}>
						Done <Icon name="PartyPopper" size={18} />
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}