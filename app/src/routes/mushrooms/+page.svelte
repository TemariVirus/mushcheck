<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	const { name, image_url, edible, description } = data.props;
</script>

<section>
	<h1>{name}</h1>
	<img src={image_url} alt={`A ${name}`} />
	<p>Edible: {edible ? 'Yes' : 'No'}</p>
	{@html description}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: left;
		width: 50%;
	}

	h1 {
		text-align: center;
	}

	img {
		max-width: 100%;
		height: auto;
		margin: 1rem;
	}
</style>