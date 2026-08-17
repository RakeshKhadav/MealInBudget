<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons.js';

	interface Props {
		title?: string;
		subtitle?: string;
		icon?: IconName;
		tinted?: boolean;
		clickable?: boolean;
		selected?: boolean;
		class?: string;
		onclick?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		title,
		subtitle,
		icon,
		tinted = false,
		clickable = false,
		selected = false,
		class: className = '',
		onclick,
		children
	}: Props = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="card {tinted ? 'bg-primary/8 text-primary-content' : 'bg-base-100 shadow-sm'} {selected ? 'ring-2 ring-primary' : ''} {clickable ? 'cursor-pointer card-lift' : ''} {className}"
	onclick={clickable ? onclick : undefined}
	onkeydown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onclick?.(); } } : undefined}
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
>
	<div class="card-body">
		{#if title || icon}
			<h3 class="card-title font-display">
				{#if icon}<Icon name={icon} size={18} />{/if}{title}
			</h3>
		{/if}
		{#if subtitle}<p class="text-sm text-base-content/70">{subtitle}</p>{/if}
		{#if children}{@render children()}{/if}
	</div>
</div>