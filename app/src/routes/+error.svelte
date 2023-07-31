<script>
	import { page } from '$app/stores';
</script>

<div>
	<h1>{$page.status}<br />{$page.error?.message}</h1>
</div>

<style>
	div {
		text-align: center;
		align-items: center;
		justify-content: center;
		display: flex;
		height: 100vh;
	}

	h1 {
		font-size: 5rem;
	}
</style>
