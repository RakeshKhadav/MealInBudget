<script lang="ts">
	interface Props {
		min: number;
		max: number;
		step?: number;
		value: number;
		label?: string;
		onchange?: (value: number) => void;
	}

	let { min, max, step = 100, value = $bindable(), label, onchange }: Props = $props();
</script>

<div class="form-control w-full">
	{#if label}
		<div class="label flex justify-between px-1 pb-2">
			<span class="label-text font-medium">{label}</span>
			<span class="badge badge-primary">₹{value}</span>
		</div>
	{/if}
	<input
		id="budget-slider"
		type="range"
		class="range range-primary range-lg"
		{min}
		{max}
		{step}
		bind:value
		oninput={() => onchange?.(value)}
	/>
	<div class="flex w-full justify-between px-1 text-xs text-base-content/60">
		<span>₹{min}</span>
		<span>₹{Math.round((min + max) / 2)}</span>
		<span>₹{max}</span>
	</div>
</div>