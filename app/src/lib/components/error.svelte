<script lang="ts">
	export let status: number;
	export let message: string;
</script>

<div>
	<h1>{status}<br />{message}</h1>
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
		max-width: 1000px;
	}
</style>
