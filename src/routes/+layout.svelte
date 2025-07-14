<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, children } = $props();
	let { session, supabase } = $derived(data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});
</script>

<header class="bg-white/90 backdrop-blur shadow-md sticky top-0 z-20">
	<div class="max-w-4xl mx-auto flex items-center gap-4 py-4 px-6">
		<a href="/" class="flex items-center gap-2">
			<img src="/logo.png" alt="Emittance Fields Logo" class="h-12 w-12 rounded shadow-sm border border-gray-200 bg-white" />
			<span class="text-3xl font-extrabold tracking-tight text-gray-800 select-none">Emittance Fields</span>
		</a>
		{#if !session}
			<a
				href="/auth"
				class="ml-auto rounded px-4 py-2 bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
			>
				Log in
			</a>
		{/if}
	</div>
</header>

<main class="container mx-auto px-4 mt-8">
	{@render children()}
</main>
