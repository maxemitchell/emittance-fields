<script lang="ts">
	import type { Field } from '$lib/db/fields';
	import type { ActionData } from '../../routes/$types';
	import { enhance } from '$app/forms';

	let { field, form } = $props<{
		field: Field;
		form: ActionData | null;
	}>();
</script>

<div class="w-full">
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
	<div class="mb-2">
		<span class="font-medium text-gray-700">Owner ID:</span>
		<span class="font-mono text-xs text-blue-700">{field.owner_id}</span>
	</div>

	<form method="POST" action="?/deleteField" class="mt-6 flex flex-col items-end" use:enhance>
		{#if form?.deleteFieldAction?.error}
			<div
				class="mb-4 flex w-full items-center gap-2 rounded border border-red-300 bg-red-100 p-3 text-sm text-red-800 shadow-sm"
			>
				<svg
					class="h-5 w-5 flex-shrink-0 text-red-500"
					fill="none"
					viewBox="0 0 20 20"
					stroke="currentColor"
				>
					<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" fill="none" />
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 7v4m0 4h.01"
					/>
				</svg>
				<div>
					<span class="font-semibold">Delete failed:</span>
					<span>{form.deleteFieldAction.error}</span>
					{#if form.deleteFieldAction.details}
						<span class="mt-1 block text-xs text-red-700"
							>{form.deleteFieldAction.details.toString()}</span
						>
					{/if}
				</div>
			</div>
		{/if}
		<input type="hidden" name="id" value={field.id} />
		<button
			type="submit"
			class="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:cursor-pointer hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
		>
			Delete Field
		</button>
	</form>
</div>
