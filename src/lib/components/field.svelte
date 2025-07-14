<script lang="ts">
	import type { Field } from '$lib/db/fields';

	let { field } = $props<{
		field: Field;
	}>();
</script>

<div class="mx-auto w-full max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
	<div class="mb-4 flex items-center">
		<span
			class="mr-3 h-6 w-6 rounded-full border border-gray-300"
			style="background-color: {field.background_color};"
		></span>
		<h2 class="flex-1 text-2xl font-bold text-gray-800">{field.name}</h2>
		{#if field.is_public}
			<span class="ml-2 rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
				>Public</span
			>
		{/if}
	</div>
	{#if field.description}
		<p class="mb-4 text-gray-700">{field.description}</p>
	{/if}
	<div class="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
		<div>
			<span class="font-medium">Size:</span>
			{field.width} × {field.height}
		</div>
		<div>
			<span class="font-medium">Created:</span>
			{new Date(field.created_at).toLocaleString()}
		</div>
		<div>
			<span class="font-medium">Updated:</span>
			{new Date(field.updated_at).toLocaleString()}
		</div>
	</div>
	<div class="mb-2">
		<span class="font-medium text-gray-700">Field ID:</span>
		<span class="font-mono text-xs text-gray-400">{field.id}</span>
	</div>

	<form method="POST" action="?/deleteField" class="mt-6 flex justify-end">
		<input type="hidden" name="id" value={field.id} />
		<button
			type="submit"
			class="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:cursor-pointer hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
		>
			Delete Field
		</button>
	</form>
</div>
