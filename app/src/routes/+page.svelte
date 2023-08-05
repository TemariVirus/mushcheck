<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Navbar from '$lib/components/navbar.svelte';
	import LoadingSpinner from '$lib/components/loading_spinner.svelte';
	import { getUserId } from '$lib';

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

	async function postScan(event: SubmitEvent) {
		event.preventDefault();

		const data = {
			image: $image
		};

		if (!data.image || !data.image?.startsWith('data:image/')) {
			alert('Please upload an image.');
			return;
		}

		const url = `https://g81zcif0y1.execute-api.us-east-1.amazonaws.com/stage/scans?userId=${getUserId()}`;
		await fetch(url, {
			method: 'POST',
			body: JSON.stringify(data)
		}).then((response) => {
			if (response.status === 200) {
				alert('Scan successfully submitted!');
			} else {
				alert('Something went wrong. Please try again.');
			}
			console.log(response);
		});
	}

	const image = writable('');
	const loading = writable(false);

	onMount(() => {
		const input = document.getElementById('mushroom-image') as HTMLInputElement;
		input.addEventListener('change', () => readFile(input.files![0]));

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
	});
</script>

<Navbar />

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
