<script>
	let { children } = $props();
</script>

<header class="mb-8 bg-white shadow">
	<nav class="container mx-auto flex items-center justify-between px-6 py-4">
		<a href="/" class="text-xl font-bold text-gray-800 transition-colors hover:text-blue-600"
			>Home</a
		>
	</nav>
</header>

<main class="container mx-auto px-4">
	{@render children()}
</main>
