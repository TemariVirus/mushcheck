<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { getJson, getUserId } from '$lib';
	import Error from '$lib/components/error.svelte';
	import LoadingSpinner from '$lib/components/loading_spinner.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import PercentBar from './percent_bar.svelte';
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

	async function getScan() {
		loading.set(true);
		try {
			const result = await getJson(`${PUBLIC_API_URL}/scans?id=${id}`, {
				headers: {
					Authorization: `Bearer ${getUserId()}`
				},
				method: 'GET'
			});

			if (result.status === 403) {
				console.error(result);
				loading.set(false);
				result.error = true;
				return result;
			}

			({
				class1,
				confidence1,
				class2,
				confidence2,
				class3,
				confidence3,
				image_url,
				created_date,
				is_owner,
				public: is_public,
				persistent
			} = result);
			created_date = new Date(created_date);

			return result;
		} finally {
			loading.set(false);
		}
	}

	async function getScans() {
		loading.set(true);
		try {
			const result = await getJson(`${PUBLIC_API_URL}/scans`, {
				headers: {
					Authorization: `Bearer ${getUserId()}`
				},
				method: 'GET'
			});
			scans = result.map((scan: any) => ({ ...scan, created_date: new Date(scan.created_date) }));

			return result;
		} finally {
			loading.set(false);
		}
	}

	async function updateScan() {
		loading.set(true);
		try {
			await fetch(`${PUBLIC_API_URL}/scans?id=${id}`, {
				headers: {
					Authorization: `Bearer ${getUserId()}`,
					'Content-Type': 'application/json'
				},
				method: 'PATCH',
				body: JSON.stringify({
					public: is_public,
					persistent
				})
			}).then(async (response) => {
				const body = await response.json();
				if (response.status === 200) {
					alert('Scan updated successfully.');
				} else {
					console.error(body);
					alert(body.message ?? 'Something went wrong. Please try again.');
				}
			});

			await getScan();
		} finally {
			loading.set(false);
		}
	}

	async function deleteScan() {
		loading.set(true);
		try {
			await fetch(`${PUBLIC_API_URL}/scans?id=${id}`, {
				headers: {
					Authorization: `Bearer ${getUserId()}`
				},
				method: 'DELETE'
			}).then(async (response) => {
				const body = await response.json();
				if (response.status === 200) {
					window.location.href = '/scans';
				} else {
					console.error(body);
					alert(body.message ?? 'Something went wrong. Please try again.');
				}
			});
		} finally {
			loading.set(false);
		}
	}

	onMount(async () => {
		id = Number.parseInt($page.url.searchParams.get('id') ?? '');
		const result = await (id ? getScan() : getScans());
		if (result.error) {
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
			<div class="form">
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
						<button on:click={updateScan} data-sveltekit-reload>Update</button>
						<button on:click={deleteScan} data-sveltekit-reload>Delete</button>
					</div>
				</div>
			</div>
		{/if}
	</section>
{:else}
	<h1>My Scans</h1>
	<section class="scan-list">
		{#if scans.length > 0}
			{#each scans as scan}
				<a href={`/scans?id=${scan.id}`} class="scan" data-sveltekit-reload>
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

	.form {
		width: 100%;
		display: flex;
		flex-direction: column;
		margin-left: 1.5rem;
		margin-top: 1rem;
		align-self: flex-start;
		align-items: left;
	}

	.form h3 {
		margin: 0.5rem;
		margin-left: 0;
	}

	.form p {
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
