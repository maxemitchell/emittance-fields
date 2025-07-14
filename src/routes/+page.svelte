<script>
	import FieldPreviewCard from '$lib/components/preview-field-card.svelte';
	import AddFieldCard from '$lib/components/add-field-card.svelte';

	let { data, form } = $props();
	let { fields, session } = $derived(data);
</script>

<section class="flex w-full flex-col items-center justify-center">
	<h1 class="mb-4 text-3xl font-bold text-gray-800">Welcome to Emittance Fields</h1>
	<p class="mb-6 max-w-xl text-center text-gray-600">
		{#if session}
			Explore public fields shared by the community below. You can also create your own or manage
			your saved fields.
		{:else}
			Explore public fields shared by the community below. Log in to create your own or manage your
			saved fields.
		{/if}
	</p>

	<div class="w-full max-w-2xl space-y-4">
		{#if session}
			<AddFieldCard {form} />
		{/if}

		{#if fields.length === 0}
			<p class="text-gray-500 italic">No public fields yet.</p>
		{:else}
			{#each fields as field (field.id)}
				<FieldPreviewCard {field} />
			{/each}
		{/if}
	</div>
</section>
