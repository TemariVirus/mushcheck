<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { getUserId } from '$lib';
	import LoadingSpinner from '$lib/components/loading_spinner.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const image = writable('');
	const loading = writable(false);

	function readFile(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== 'string') {
				return;
			}
			if (!reader.result.startsWith('data:image/')) {
				return;
			}
			image.set(reader.result);
		};
		reader.readAsDataURL(file);
	}

	function setupDropZone() {
		const dropZone = document.querySelector('.drop-zone') as HTMLLabelElement;

		dropZone.addEventListener('dragenter', (event) => {
			event.preventDefault();
			dropZone.classList.add('drag-over');
		});

		dropZone.addEventListener('dragover', (event) => {
			event.preventDefault();
			dropZone.classList.add('drag-over');
		});

		dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

		dropZone.addEventListener('drop', (event) => {
			event.preventDefault();
			dropZone.classList.remove('drag-over');
			readFile(event.dataTransfer!.files[0]);
		});
	}

	async function postScan(event: SubmitEvent) {
		event.preventDefault();
		loading.set(true);

		const data = {
			image: $image,
			user_id: getUserId()
		};

		if (!data.image || !data.image?.startsWith('data:image/')) {
			alert('Please upload an image.');
			loading.set(false);
			return;
		}

		await fetch(`${PUBLIC_API_URL}/scans`, {
			headers: {
				Authorization: `Bearer ${getUserId()}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(data)
		})
			.then(async (response) => {
				const body = await response.json();
				if (response.status === 201) {
					window.location.href = `/scans?id=${body.scan_id}`;
				} else {
					console.error(body);
					alert(body.message ?? 'Something went wrong. Please try again.');
				}
			})
			.catch((error) => {
				loading.set(false);
			});

		loading.set(false);
	}

	onMount(() => {
		const input = document.getElementById('mushroom-image') as HTMLInputElement;
		input.addEventListener('change', () => readFile(input.files![0]));
		setupDropZone();
	});
</script>

<Navbar />

{#if $loading}
	<LoadingSpinner />
{:else}
	<div class="main-content">
		<h1 class="huge-text">MushCheck</h1>
		<h3>Your trusted AI-powered tool for identifying mushroom genera.</h3>
		<form on:submit={postScan}>
			<label for="mushroom-image" class="drop-zone">
				{#if $image}
					<img src={$image} alt="Your mushroom" />
				{:else}
					<div class="drop-zone-text">Drag and drop an image of a mushroom here</div>
				{/if}
				<input type="file" id="mushroom-image" name="mushroom-image" accept="image/*" />
			</label>
			<button type="submit">Scan</button>
		</form>
	</div>
{/if}

<style>
	.main-content {
		text-align: center;
	}

	h3 {
		font-size: larger;
	}

	form button {
		font-size: larger;
		padding: 0.5rem 2rem;
		border-radius: 8px;
	}

	form button:hover {
		background-color: #e0e0e0;
	}
</style>
