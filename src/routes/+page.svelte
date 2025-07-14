<script>
	import FieldPreviewCard from '$lib/components/field-preview-card.svelte';

	let { data } = $props();
	let { fields } = $derived(data);
</script>
<!--
	This is the home page for unauthenticated users.
	Here you can browse public fields shared by the community.
	To create or manage your own fields, please log in.
-->

<section class="flex flex-col items-center justify-center w-full">
	<h1 class="text-3xl font-bold mb-4 text-gray-800">Welcome to Emittance Fields</h1>
	<p class="mb-6 text-gray-600 text-center max-w-xl">
		Explore public fields shared by the community below. Log in to create your own or manage your saved fields.
	</p>
	{#if fields.length === 0}
		<p class="text-gray-500 italic">No public fields yet.</p>
	{:else}
		<ul class="w-full max-w-2xl space-y-4">
			{#each fields as field (field.id)}
				<li>
					<FieldPreviewCard {field} />
				</li>
			{/each}
		</ul>
	{/if}
</section>
