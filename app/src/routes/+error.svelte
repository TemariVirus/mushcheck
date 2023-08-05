<script lang="ts">
	import { page } from '$app/stores';
	import Navbar from '$lib/components/navbar.svelte';

	import Error from '$lib/components/error.svelte';
</script>

<Navbar />

<Error status={$page.status} message={$page.error?.message ?? ''} />
