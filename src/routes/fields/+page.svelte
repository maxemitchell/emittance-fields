<script lang="ts">
	import { invalidate } from '$app/navigation';
	import type { EventHandler } from 'svelte/elements';

	let { data } = $props();
	let { fields, supabase, user } = $derived(data);

	const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (evt) => {
		evt.preventDefault();

		console.log('evt', evt);
		if (!evt.target) return;

		const form = evt.target as HTMLFormElement;

		const name = (new FormData(form).get('name') ?? '') as string;
		if (!name) return;

		const { error } = await supabase.from('fields').insert({ name, owner_id: user?.id });
		if (error) console.error(error);

		invalidate('supabase:db:fields');
		form.reset();
	};
</script>

<div class="mx-auto mt-10 max-w-xl space-y-8 rounded bg-white p-8 shadow">
	<h1 class="mb-2 text-2xl font-bold text-gray-800">
		Private page for user: <span class="text-blue-600">{user?.email}</span>
	</h1>
	<div>
		<h2 class="mb-4 text-xl font-semibold text-gray-700">Fields</h2>
		<ul class="space-y-2">
			{#each fields as field (field.id)}
				<li class="rounded bg-gray-100 px-4 py-2 text-gray-800">{field.name}</li>
			{/each}
		</ul>
	</div>
	<form onsubmit={handleSubmit} class="mt-6 flex items-end space-x-4">
		<div class="flex-1">
			<label class="mb-2 block font-semibold text-gray-700" for="name"> Add a field </label>
			<input
				id="name"
				name="name"
				type="text"
				class="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				placeholder="Field name"
				required
			/>
		</div>
		<button
			type="submit"
			class="rounded bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
		>
			Add
		</button>
	</form>
</div>
