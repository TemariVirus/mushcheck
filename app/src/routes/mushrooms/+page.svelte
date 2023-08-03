<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let name: string;
	let edible: boolean;
	let description: string;
	let extras_url: string;
	let image_url: string;
	let error = false;

	// Get mushroom info from DB
	onMount(async () => {
		name = $page.url.searchParams.get('name') ?? '';
		let result = await fetch(
			`https://5yrf3rrviwwrb6xhu77445ssiy0kcsqb.lambda-url.us-east-1.on.aws?name=${name}`
		)
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.catch(async (e) => {
				error = true;
				const err_msg = await e.text();
				throw new Error(err_msg);
			});

		console.log(result);
		({ description, extras_url, image_url } = result);
		edible = result.edible == 0;
	});
</script>

<section>
	{#if error}
		<h1>Error 404</h1>
		<p>Mushroom not found</p>
		<p><a href="/">Go home</a></p>
	{:else}
		<img src={image_url} alt={`A ${name}`} />

		<h2>{name}</h2>
		<p>Edible: {edible ? 'Yes' : 'No'}</p>
		<p>{description}</p>

		{#if extras_url}
			<p>Further reading: <a href={extras_url}>{extras_url}</a></p>
		{/if}
	{/if}
</section>

<style>
	section {
		text-align: center;
	}
	h2 {
		text-align: center;
	}
</style>
