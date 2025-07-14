<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from '../../routes/$types.d';

	let { form } = $props<{
		form: ActionData | null;
	}>();

	let name = $state('');
	let description = $state('');
	let width = $state(800);
	let height = $state(600);
	let backgroundColor = $state('#ffffff');
	let isPublic = $state(false);
</script>

<form
	method="POST"
	action="?/createField"
	use:enhance
	class="w-full rounded-lg border bg-white p-6 shadow-sm"
>
	<h3 class="mb-4 text-lg font-semibold text-gray-800">Create New Field</h3>

	{#if form?.error}
		<div class="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<div class="space-y-4">
		<div>
			<label for="name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
			<input
				id="name"
				name="name"
				type="text"
				bind:value={name}
				placeholder="My Field"
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				required
			/>
		</div>

		<div>
			<label for="description" class="mb-1 block text-sm font-medium text-gray-700"
				>Description (optional)</label
			>
			<textarea
				id="description"
				name="description"
				bind:value={description}
				placeholder="Describe your field..."
				rows="2"
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			></textarea>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="width" class="mb-1 block text-sm font-medium text-gray-700">Width</label>
				<input
					id="width"
					name="width"
					type="number"
					bind:value={width}
					min="1"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					required
				/>
			</div>
			<div>
				<label for="height" class="mb-1 block text-sm font-medium text-gray-700">Height</label>
				<input
					id="height"
					name="height"
					type="number"
					bind:value={height}
					min="1"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					required
				/>
			</div>
		</div>

		<div>
			<label for="backgroundColor" class="mb-1 block text-sm font-medium text-gray-700"
				>Background Color</label
			>
			<div class="flex gap-2">
				<input
					id="backgroundColor"
					name="background_color"
					type="color"
					bind:value={backgroundColor}
					class="h-10 w-12 cursor-pointer rounded border border-gray-300"
				/>
				<input
					type="text"
					bind:value={backgroundColor}
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					placeholder="#ffffff"
				/>
			</div>
		</div>

		<div class="flex items-center">
			<input
				id="is_public"
				name="is_public"
				type="checkbox"
				bind:checked={isPublic}
				value="true"
				class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			/>
			<label for="is_public" class="ml-2 block text-sm text-gray-700">
				Make this field public
			</label>
		</div>
	</div>

	<button
		type="submit"
		disabled={form?.pending}
		class="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
	>
		{form?.pending ? 'Creating...' : 'Create Field'}
	</button>
</form>
