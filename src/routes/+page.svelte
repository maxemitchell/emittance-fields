<script>
	let { data } = $props();
</script>

<ul>
	{#each data.test_table as test_table (test_table.id)}
		<li>{test_table.something}</li>
	{/each}
</ul>
