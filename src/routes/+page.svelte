<script>
	let { data } = $props();
	let { test_table } = $derived(data);
</script>

<h1>Welcome to Supabase!</h1>
<ul>
	{#each test_table as test_table (test_table.id)}
		<li>{test_table.something}</li>
	{/each}
</ul>
