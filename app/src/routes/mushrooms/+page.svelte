<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const mushroom_url = 'https://5yrf3rrviwwrb6xhu77445ssiy0kcsqb.lambda-url.us-east-1.on.aws/';

	let name: string;
	let edibility: boolean;
	let description: string;
	let furtherReading: string;
	let imageUrl: string;

	// Get mushroom info from db
	onMount(async () => {
		let name = $page.url.searchParams.get('name');
		let result = await fetch(`${mushroom_url}?name=${name}`).then((res) => res.json());
		console.log(result);
		({ name, edibility, description, furtherReading, imageUrl } = result);
	});
</script>

<section>
	<img src={imageUrl} alt={`A ${name}`} />

	<h2>{name}</h2>
	<p>Edibility: {edibility}</p>
	<p>{description}</p>

	{#if furtherReading}
		<p>Further reading: <a href={furtherReading}>{furtherReading}</a></p>
	{/if}
</section>

<style>
	h2 {
		text-align: center;
	}
</style>
