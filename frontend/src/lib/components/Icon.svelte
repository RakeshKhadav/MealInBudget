<script lang="ts">
	import { icons } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { IconName } from '$lib/types/icons.js';

	interface Props {
		name: IconName;
		size?: number;
		strokeWidth?: number;
		class?: string;
		color?: string;
	}

	let { name, size = 20, strokeWidth = 2, class: className = '', color }: Props = $props();

	const Icon = $derived(icons[name] as unknown as Component | undefined);
</script>

{#if Icon}
	<Icon {size} {strokeWidth} class={className} {color} aria-hidden="true" />
{/if}