<form method="POST" action="?/login" class="mx-auto max-w-md space-y-6 rounded bg-white p-8 shadow">
	<div>
		<label class="mb-2 block font-semibold text-gray-700" for="email"> Email </label>
		<input
			id="email"
			name="email"
			type="email"
			class="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			required
		/>
	</div>
	<div>
		<label class="mb-2 block font-semibold text-gray-700" for="password"> Password </label>
		<input
			id="password"
			name="password"
			type="password"
			class="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			required
		/>
	</div>
	<div class="flex space-x-4">
		<button
			type="submit"
			class="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
		>
			Login
		</button>
		<button
			type="submit"
			formaction="?/signup"
			class="w-full rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300"
		>
			Sign up
		</button>
	</div>
</form>
