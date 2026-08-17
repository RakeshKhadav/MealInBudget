<script lang="ts">
	interface Props {
		checked?: boolean;
		label?: string;
		value?: string;
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
	}

	let { checked = false, label, value, disabled = false, onchange }: Props = $props();
</script>

<label class="label cursor-pointer gap-3 rounded-xl hover:bg-primary/8 px-2 py-2 transition-colors">
	<span class="label-text">{label ?? value}</span>
	<input
		type="checkbox"
		class="checkbox checkbox-primary checkbox-sm rounded-md"
		{value}
		bind:checked
		{disabled}
		onchange={() => onchange?.(checked)}
	/>
</label>