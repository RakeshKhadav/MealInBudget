<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from './Icon.svelte';

	let offline = $state(false);

	$effect(() => {
		if (!browser) return;
		const on = () => (offline = false);
		const off = () => (offline = true);
		offline = !navigator.onLine;
		window.addEventListener('online', on);
		window.addEventListener('offline', off);
		return () => {
			window.removeEventListener('online', on);
			window.removeEventListener('offline', off);
		};
	});
</script>

{#if offline}
	<div class="alert alert-warning rounded-none text-sm sticky top-0 z-40">
		<Icon name="WifiOff" size={18} />
		<span>You're offline — showing saved plans only</span>
	</div>
{/if}