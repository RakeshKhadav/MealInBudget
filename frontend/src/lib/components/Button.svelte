<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'soft';
		size?: 'sm' | 'md' | 'lg';
		wide?: boolean;
		loading?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		wide = false,
		loading = false,
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const variantClass = $derived(
		variant === 'primary'
			? 'btn-primary'
			: variant === 'secondary'
				? 'btn-outline'
				: variant === 'success'
					? 'btn-success'
					: variant === 'danger'
						? 'btn-error'
						: variant === 'soft'
							? 'btn-soft'
							: 'btn-ghost'
	);
	const sizeClass = $derived(size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '');
</script>

<button
	type={type}
	class="btn {variantClass} {sizeClass} {wide ? 'btn-wide' : ''} {className}"
	{disabled}
	onclick={onclick}
>
	{#if loading}
		<span class="loading loading-spinner loading-sm"></span>
	{:else if children}
		{@render children()}
	{/if}
</button>