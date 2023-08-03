<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto, invalidate } from '$app/navigation';
	import { getJson } from '$lib';

	export let mushrooms: { name: string; image_url: string }[] = [];
	export let name: string | null = '';
	export let image_url: string | null = null;
	export let edible: boolean | null = null;
	export let description: string | null = '';

	let loading = true;

	onMount(async () => {
		name = $page.url.searchParams.get('name');
		let result;

		if (!name) {
			result = await getJson(
				`https://5yrf3rrviwwrb6xhu77445ssiy0kcsqb.lambda-url.us-east-1.on.aws`
			);
			mushrooms = result;
		} else {
			result = await getJson(
				`https://5yrf3rrviwwrb6xhu77445ssiy0kcsqb.lambda-url.us-east-1.on.aws?name=${name}`
			);
			image_url = result.image_url;
			edible = result.edible == 0;
			description = result.description;
		}

		if (result.error) {
			window.location.href = '/mushrooms';
		} else {
			loading = false;
		}
	});
</script>

<section>
	{#if loading}
		<h1>Loading...</h1>
	{:else if name}
		<h1>{name}</h1>
		<img src={image_url} alt={`${name}`} />
		<p>Edible: {edible ? 'Yes' : 'No'}</p>
		{@html description}
	{:else}
		{#each mushrooms as mushroom}
			<a href={`/mushrooms?name=${mushroom.name}`} data-sveltekit-reload>
				<img src={mushroom.image_url} alt={`${mushroom.name}`} />
				<p>{mushroom.name}</p>
			</a>
		{/each}
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: left;
		width: 50%;
	}

	h1 {
		text-align: center;
	}

	img {
		max-width: 100%;
		height: auto;
		margin: 1rem;
	}
</style>
