<script>
	import FieldPreviewCard from '$lib/components/field-preview-card.svelte';

	let { data } = $props();
	let { fields } = $derived(data);
</script>

<h1>Welcome to Emittance Fields!</h1>
<ul>
	{#each fields as field (field.id)}
		<li>
			<FieldPreviewCard {field} />
		</li>
	{/each}
</ul>
