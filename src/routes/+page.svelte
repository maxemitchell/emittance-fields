<script>
	import FieldPreviewCard from '$lib/components/field-preview-card.svelte';

	let { data } = $props();
	let { fields } = $derived(data);
</script>

{#if fields.length === 0}
	<p class="text-gray-500 italic">No public fields yet.</p>
{:else}
	<ul>
		{#each fields as field (field.id)}
			<li>
				<FieldPreviewCard {field} />
			</li>
		{/each}
	</ul>
{/if}
