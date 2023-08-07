<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { getJson, getUserId } from '$lib';
	import Error from '$lib/components/error.svelte';
	import LoadingSpinner from '$lib/components/loading_spinner.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import PercentBar from '$lib/components/percent_bar.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

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
	let created_date: Date = new Date();
	let is_owner = false;
	let is_public = false;
	let persistent = false;

	function updateScan() {
		fetch(`${PUBLIC_API_URL}/scans?id=${id}&user_id=${getUserId()}`, {
			method: 'PATCH',
			body: JSON.stringify({
				public: is_public,
				persistent
			})
		}).then(async (response) => {
			console.log(is_public);
			console.log(persistent);
			const body = await response.json();
			console.log(body);
			if (response.status === 200) {
				alert('Scan updated successfully.');
			} else {
				alert(body.message ?? 'Something went wrong. Please try again.');
			}
		});
	}

	function deleteScan() {
		fetch(`${PUBLIC_API_URL}/scans?id=${id}&user_id=${getUserId()}`, {
			method: 'DELETE'
		}).then(async (response) => {
			const body = await response.json();
			if (response.status === 200) {
				window.location.href = '/scans';
			} else {
				alert(body.message ?? 'Something went wrong. Please try again.');
			}
		});
	}

	onMount(async () => {
		id = Number.parseInt($page.url.searchParams.get('id') ?? '');
		let result;

		if (!id) {
			result = await getJson(`${PUBLIC_API_URL}/scans?user_id=${getUserId()}`);
			scans = result.map((scan: any) => ({ ...scan, created_date: new Date(scan.created_date) }));
		} else {
			result = await getJson(`${PUBLIC_API_URL}/scans?id=${id}&user_id=${getUserId()}`);
			if (result.status === 403) {
				console.log(result);
				load_error = {
					status: result.status,
					message: result.message
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
				is_owner,
				public: is_public,
				persistent
			} = result);
			created_date = new Date(created_date);
		}

		if (result.error) {
			load_error = {
				status: result.status,
				message: result.message
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
		{#if is_owner}
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
					<p class="info-text">
						<i>Scans are automatically deleted if no one visits them for 30 days.</i>
					</p>
				</label>
				<div class="form-foot">
					<p>Scan taken: {created_date.toLocaleString()}</p>
					<div class="buttons">
						<button data-sveltekit-reload on:click={deleteScan}>Delete</button>
						<button type="submit" data-sveltekit-reload>Update</button>
					</div>
				</div>
			</form>
		{/if}
	</section>
{:else}
	<h1>My Scans</h1>
	<section class="scan-list">
		{#if scans.length > 0}
			{#each scans as scan}
				<a href={`/scans?id=${scan.id}&user_id=${getUserId()}`} class="scan" data-sveltekit-reload>
					<p>{Math.round(scan.confidence1 * 10) / 10}% {scan.class1}</p>
					<p>{scan.created_date.toLocaleString()}</p>
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
		max-width: 50%;
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
		height: 100%;
		border-radius: 60px;
		padding: 1.5rem;
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
		padding: 0.3rem 1.2rem;
		border-radius: 8px;
	}

	.form-foot button:hover {
		background-color: #ddd;
		cursor: pointer;
	}

	.buttons button {
		margin-right: 3rem;
	}

	.buttons button:not(:last-of-type) {
		margin-right: 1rem;
	}

	.info-text {
		margin-top: 0;
		color: #ddd;
		font-size: 0.9rem;
	}

	.no-scans-txt {
		text-align: center;
	}
</style>
