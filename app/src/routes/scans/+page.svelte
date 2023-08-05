<script lang="ts">
	import LoadingSpinner from '$lib/components/loading_spinner.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import PercentBar from '$lib/components/percent_bar.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { getJson, getUserId } from '$lib';
	import Error from '$lib/components/error.svelte';

	const get_url = `https://g81zcif0y1.execute-api.us-east-1.amazonaws.com/stage/scans`;
	const loading = writable(true);
	let load_error: { status: number; message: string } | null = null;

	let scans: { id: number; class1: string; confidence1: number; created_date: Date }[] = [];
	let id = Number.NaN;
	let class1 = '';
	let confidence1 = Number.NaN;
	let class2 = '';
	let confidence2 = Number.NaN;
	let class3 = '';
	let confidence3 = Number.NaN;
	let image_url = '';
	let created_date: Date | string = '';
	let is_public = false;
	let persistent = false;

	function updateScan() {}

	onMount(async () => {
		id = Number.parseInt($page.url.searchParams.get('id') ?? '');
		let result;

		if (!id) {
			result = await getJson(`${get_url}?user_id=${getUserId()}`);
			scans = result;
		} else {
			result = await getJson(`${get_url}?id=${id}&user_id=${getUserId()}`);
			if (result.status === 403) {
				const stream_reader = (await result.body.getReader().read()).value;
				const body = new TextDecoder('utf-8').decode(stream_reader);
				const message = JSON.parse(body).message;
				load_error = {
					status: result.status,
					message: message
				};

				loading.set(false);
				return;
			}
			({
				class1,
				confidence1,
				class2,
				confidence2,
				class3,
				confidence3,
				image: image_url,
				created_date,
				public: is_public,
				persistent
			} = result);
			created_date = new Date(created_date as string);
		}

		if (result.error) {
			load_error = {
				status: result.status,
				message: result.body
			};
		}

		loading.set(false);
	});
</script>

<Navbar />

{#if load_error}
	<Error status={load_error.status} message={load_error.message} />
{:else if $loading}
	<LoadingSpinner />
{:else if id}
	<section class="scan-info">
		<img src={image_url} alt="Scan" class="scan-img" />
		<PercentBar name={class1} percent={confidence1} />
		{#if class2}
			<PercentBar name={class2} percent={confidence2} />
		{/if}
		{#if class3}
			<PercentBar name={class3} percent={confidence3} />
		{/if}
		<form on:submit={updateScan}>
			<label for="public">
				<h3>
					Public
					<input type="checkbox" bind:checked={is_public} />
				</h3>
			</label>
			<label for="persistent">
				<h3>
					Don't delete
					<input type="checkbox" bind:checked={persistent} />
				</h3>
			</label>
			<div class="form-foot">
				<p>Scan taken: {created_date.toLocaleString()}</p>
				<button type="submit">Update</button>
			</div>
		</form>
	</section>
{:else}
	<h1>My Scans</h1>
	<section class="scan-list">
		{#if scans.length > 0}
			{#each scans as scan}
				<a href={`/scans?id=${scan.id}&user_id=${getUserId()}`} class="scan" data-sveltekit-reload>
					<p>{Math.round(scan.confidence1 * 10) / 10}% {scan.class1}</p>
					<p>{scan.created_date}</p>
				</a>
			{/each}
		{:else}
			<h2 class="no-scans-txt">You have no scans</h2>
		{/if}
	</section>
{/if}

<style>
	.scan-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 50%;
	}

	.scan-list {
		display: flex;
		flex-direction: column;
		align-items: left;
		max-width: 70%;
	}

	h1 {
		text-align: center;
	}

	a {
		text-decoration: none;
		color: #fff;
	}

	.scan {
		display: flex;
		flex-direction: row;
		padding: 1rem;
		justify-content: space-between;
		margin: 0 3rem;
		border-radius: 16px;
	}

	.scan:hover {
		background-color: #555;
	}

	.scan-img {
		width: 100%;
		max-width: 600px;
		max-height: 500px;
		border-radius: 16px;
		margin: 1rem;
	}

	form {
		width: 100%;
		display: flex;
		flex-direction: column;
		margin-left: 1.5rem;
		margin-top: 1rem;
		align-self: flex-start;
		align-items: left;
	}

	form h3 {
		margin: 0.5rem;
		margin-left: 0;
	}

	form p {
		margin: 1rem;
		margin-left: 0;
	}

	.form-foot {
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.form-foot button {
		margin-right: 3rem;
		padding: 0.3rem 1.2rem;
		border-radius: 8px;
	}

	.form-foot button:hover {
		background-color: #ddd;
		cursor: pointer;
	}

	.no-scans-txt {
		text-align: center;
	}
</style>
