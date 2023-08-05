<script lang="ts">
	export let name = '';
	export let percent: number;
</script>

<div class="container {name ? 'right' : ''}">
	{#if name}
		<h2>{name}</h2>
	{/if}
	<div class="percent-bar {name ? 'small' : ''}">
		<div class="percent-bar-fill" style="width: {percent}%" />
		<p>{Math.round(percent * 10) / 10}%</p>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: row;
		width: 100%;
		justify-content: center;
		padding: 1.5rem;
		align-items: center;
	}

	h2 {
		margin: 0;
		padding: 0;
	}

	.percent-bar {
		position: relative;
		width: 100%;
		height: 1.5rem;
		background-color: #e0e0e0;
		border-radius: 0.5rem;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.percent-bar-fill {
		position: absolute;
		left: 0;
		width: 0%;
		height: 1.5rem;
		height: 100%;
		background-color: #4caf50;
	}

	.percent-bar p {
		position: relative;
		margin: 0;
		padding: 0;
		color: #000;
		z-index: 1;
	}

	.right {
		flex-direction: row;
		justify-content: space-between;
	}

	.small {
		width: 70%;
	}
</style>
