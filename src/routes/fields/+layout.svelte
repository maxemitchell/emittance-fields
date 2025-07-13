<script>
	let { data, children } = $props();
	let { supabase } = $derived(data);

	const logout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
		}
	};
</script>

<header class="mb-8 bg-white shadow">
	<nav class="container mx-auto flex items-center justify-between px-6 py-4">
		<a href="/" class="text-xl font-bold text-gray-800 transition-colors hover:text-blue-600"
			>Home</a
		>
		<button
			onclick={logout}
			class="ml-4 rounded bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
		>
			Logout
		</button>
	</nav>
</header>
<main class="container mx-auto px-4">
	{@render children()}
</main>
