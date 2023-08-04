<nav>
	<a href="/" data-sveltekit-reload>Home</a>
	<a href="/mushrooms" data-sveltekit-reload>Dictionary</a>
	<a href="/scans" data-sveltekit-reload>My Scans</a>
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-around;
		align-items: center;
		background-color: #333;
		color: #fff;
		padding: 1rem;
		margin: 0;
		margin-bottom: 1rem;
		top: 0;
	}

	a {
		text-decoration: none;
		color: #fff;
		font-size: 28px;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
