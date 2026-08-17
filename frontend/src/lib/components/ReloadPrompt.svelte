<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import Icon from './Icon.svelte';

	const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
		onRegisterError(error) {
			console.error('Service worker registration error', error);
		}
	});

	const show = $derived($offlineReady || $needRefresh);
</script>

{#if show}
	<div class="toast toast-center toast-bottom mb-20 z-50">
		<div class="alert shadow-lg bg-base-100 border border-base-300">
			<Icon name={$offlineReady ? 'CircleCheck' : 'RefreshCw'} size={20} class="text-success" />
			<div class="flex-1">
				{#if $offlineReady}
					<span>App ready to work offline</span>
				{:else}
					<span>New content available, reload to update.</span>
				{/if}
			</div>
			{#if $needRefresh}
				<button class="btn btn-sm btn-primary" onclick={() => updateServiceWorker(true)}>Reload</button>
			{/if}
			<button
				class="btn btn-sm btn-ghost"
				onclick={() => {
					$offlineReady = false;
					$needRefresh = false;
				}}
			>
				Close
			</button>
		</div>
	</div>
{/if}