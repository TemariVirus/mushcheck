<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import LoadingSpinner from '$lib/components/loading_spinner.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { getJson, getUserId } from '$lib';
	import { error } from '@sveltejs/kit';

	const get_url = `https://g81zcif0y1.execute-api.us-east-1.amazonaws.com/stage/scans`;
	const loading = writable(true);
	const allowed = writable(true);

	let scans: { id: number; class1: string; confidence1: number }[] = [];
	let id = Number.NaN;
	let class1 = '';
	let confidence1 = Number.NaN;
	let class2 = '';
	let confidence2 = Number.NaN;
	let class3 = '';
	let confidence3 = Number.NaN;
	let image_url = '';
	let is_public = false;
	let persistent = false;

	onMount(async () => {
		id = Number.parseInt($page.url.searchParams.get('id') ?? '');
		let result;

		if (!id) {
			result = await getJson(`${get_url}?user_id=${getUserId()}`);
			scans = result;
		} else {
			result = await getJson(`${get_url}?id=${id}&user_id=${getUserId()}`);
			({
				class1,
				confidence1,
				class2,
				confidence2,
				class3,
				confidence3,
				image_url,
				public: is_public,
				persistent
			} = result);

			if (result.status === 403) {
				allowed.set(false);
			}
		}

		if (result.error) {
			throw error(404);
		}

		loading.set(false);
	});
</script>

<Navbar />

{#if !$allowed}
	<h1>403</h1>
	<h1>Scan is private</h1>
{:else if $loading}
	<LoadingSpinner />
{:else if id}
	<section />
{:else}
	<h1>My Scans</h1>
	<section>
		{#each scans as scan}
			<a href={`/scans?id=${scan.id}&user_id=${getUserId()}`} class="scan">
				<p>{scan.confidence1 * 100}% {scan.class1}</p>
			</a>
		{/each}
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

	.scan {
		display: flex;
		flex-direction: row;
	}
</style>
