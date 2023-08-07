<script lang="ts">
	export let name: string;
	export let percent: number;
</script>

<div class="container">
	<h2><a href={`/mushrooms?name=${name}`}>{name}</a></h2>
	<div class="percent-bar">
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
		flex-direction: row;
		justify-content: space-between;
	}

	h2 {
		margin: 0;
		padding: 0;
	}

	a {
		text-decoration: none;
		color: #fff;
	}

	a:hover {
		text-decoration: underline;
	}

	.percent-bar {
		position: relative;
		width: 70%;
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
</style>
