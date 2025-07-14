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

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
	<header class="bg-white/90 backdrop-blur shadow-md sticky top-0 z-20">
		<div class="max-w-4xl mx-auto flex items-center gap-4 py-4 px-6">
			<img src="/logo.png" alt="Emittance Fields Logo" class="h-10 w-10 rounded shadow-sm border border-gray-200 bg-white" />
			<span class="text-3xl font-extrabold tracking-tight text-gray-800 select-none">Emittance Fields</span>
		</div>
	</header>
	<main class="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
