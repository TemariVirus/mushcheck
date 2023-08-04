<script lang="ts">
	import {} from '$lib/stores/persistent';
	import Navbar from '$lib/components/navbar.svelte';
</script>

<Navbar />

<div class="main-content">
	<h1 class="huge-text">MushCheck</h1>
	<h3>Your trusted AI-powered tool for identifying mushroom genera.</h3>
</div>

<style>
	.main-content {
		text-align: center;
	}

	h3 {
		font-size: larger;
	}
</style>
