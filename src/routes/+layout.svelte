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

<header class="sticky top-0 z-20 bg-white/90 shadow-md backdrop-blur">
	<div class="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
		<a href="/" class="flex items-center gap-2">
			<img
				src="/logo.png"
				alt="Emittance Fields Logo"
				class="h-12 w-12 rounded border border-gray-200 bg-white shadow-sm"
			/>
			<span class="text-3xl font-extrabold tracking-tight text-gray-800 select-none"
				>Emittance Fields</span
			>
		</a>
		{#if !session}
			<a
				href="/auth"
				class="ml-auto rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow transition-colors hover:bg-blue-700"
			>
				Log in
			</a>
		{:else}
			{#if session.user?.id}
				<span class="mr-4 ml-auto font-medium text-gray-700">
					Hi <span class="rounded bg-gray-100 px-2 py-0.5 font-mono text-blue-700"
						>{session.user.id}</span
					>!
				</span>
			{/if}
			<a
				href="/auth/logout"
				class="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 shadow transition-colors hover:bg-gray-300"
			>
				Log out
			</a>
		{/if}
	</div>
</header>

<main class="container mx-auto mt-8 px-4">
	{@render children()}
</main>
