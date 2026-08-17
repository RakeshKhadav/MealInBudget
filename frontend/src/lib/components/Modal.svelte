<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		open?: boolean;
		title?: string;
		onclose?: () => void;
		children?: Snippet;
	}

	let { open = false, title, onclose, children }: Props = $props();

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
		<div class="modal-box max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
			<div class="flex items-start justify-between gap-4">
				{#if title}
					<h3 class="font-bold text-lg leading-tight">{title}</h3>
				{/if}
				<button class="btn btn-ghost btn-sm btn-circle shrink-0" onclick={onclose} aria-label="Close">
					<Icon name="X" size={18} />
				</button>
			</div>
			<div class="py-4">{#if children}{@render children()}{/if}</div>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={onclose}>Close</button>
			</div>
		</div>
	</div>
{/if}