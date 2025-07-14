<script lang="ts">
	import Field from '$lib/components/field.svelte';

	let { data } = $props();
	let { field } = $derived(data);
</script>

<a
	href="/"
	class="mb-4 inline-flex items-center text-blue-600 hover:underline focus:outline-none"
	style="text-decoration: none;"
>
	<!-- Simple left arrow SVG icon -->
	<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
	</svg>
	Back
</a>

<Field {field} />
