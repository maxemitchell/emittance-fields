<script lang="ts">
	import type { Field } from '$lib/db/fields';

	let { field } = $props<{
		field: Field;
	}>();
</script>

<a
	href={`/fields/${field.id}`}
	class="block rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:bg-gray-50 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
	style="text-decoration: none;"
>
	<div class="mb-2 flex items-center">
		<span
			class="mr-2 h-4 w-4 rounded-full border border-gray-300"
			style="background-color: {field.background_color};"
		></span>
		<span class="flex-1 text-lg font-semibold">{field.name}</span>
		{#if field.is_public}
			<span class="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
				>Public</span
			>
		{/if}
	</div>
	{#if field.description}
		<div class="mb-2 text-sm text-gray-700">{field.description}</div>
	{/if}
	<div class="flex flex-wrap gap-2 text-xs text-gray-500">
		<span>Size: {field.width} × {field.height}</span>
		<span class="rounded bg-gray-100 px-2 py-0.5"
			>{new Date(field.created_at).toLocaleDateString()}</span
		>
		<span class="rounded bg-gray-50 px-2 py-0.5 font-mono text-blue-700"
			>Owner: {field.owner_id}</span
		>
	</div>
</a>
