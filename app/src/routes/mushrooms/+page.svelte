<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { getJson } from '$lib';
	import Error from '$lib/components/error.svelte';
	import LoadingSpinner from '$lib/components/loading_spinner.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let load_error: { status: number; message: string } | null = null;
	const loading = writable(true);

	let mushrooms: { name: string; image_url: string }[] = [];
	let name = '';
	let image_url = '';
	let edible = false;
	let description = '';

	async function getMushroom() {
		loading.set(true);
		const result = await getJson(`${PUBLIC_API_URL}/mushrooms?name=${name}`);
		image_url = result.image_url;
		edible = result.edible == 0;
		description = result.description;

		loading.set(false);
		return result;
	}

	async function getMushrooms() {
		loading.set(true);
		const result = await getJson(`${PUBLIC_API_URL}/mushrooms`);
		mushrooms = result;

		loading.set(false);
		return result;
	}

	onMount(async () => {
		name = $page.url.searchParams.get('name') ?? '';
		const result = await (name ? getMushroom() : getMushrooms());

		if (result.error) {
			console.error(result);
			if (name) {
				window.location.href = '/mushrooms';
				return;
			}
			load_error = {
				status: result.status,
				message: result.message
			};
		}
	});
</script>

<Navbar />

{#if load_error}
	<Error status={load_error.status} message={load_error.message} />
{:else if $loading}
	<LoadingSpinner />
{:else if name}
	<section class="mushroom-info-card">
		<h1>{name}</h1>
		<img src={image_url} alt={`${name}`} />
		<p><b>Edible:</b> {edible ? 'Yes' : 'No'}</p>
		{@html description}
	</section>
{:else}
	<h1>Mushrooms</h1>
	<section class="mushrooms-card">
		<div class="mushroom-grid">
			{#each mushrooms as mushroom}
				<a href={`/mushrooms?name=${mushroom.name}`} class="mushroom-card" data-sveltekit-reload>
					<img src={mushroom.image_url} alt={`${mushroom.name}`} />
					<h2>{mushroom.name}</h2>
				</a>
			{/each}
		</div>
	</section>
{/if}

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: left;
	}

	h1 {
		text-align: center;
	}

	img {
		max-width: 100%;
		height: auto;
		margin: 1rem;
	}

	.mushroom-info-card {
		max-width: 50%;
	}

	.mushrooms-card {
		max-width: 80%;
	}

	.mushroom-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		color: #fff;
	}

	.mushroom-grid img {
		height: 250px;
		width: 100%;
		object-fit: cover;
	}

	.mushroom-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		grid-gap: 2rem;
	}
</style>
