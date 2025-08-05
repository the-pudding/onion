<script>
	// shadow, plain, line, bubble
	import wordmark from "$svg/wordmark-shadow.svg";
</script>

<header>
	<div class="wordmark">
		<a href="https://pudding.cool" aria-label="The Pudding" target="_self"
			>{@html wordmark}</a
		>
	</div>
</header>

<style>
	header {
		padding: 2rem 0;
	}
	.wordmark {
		max-width: 14em;
		margin: 0 auto;
		padding: 32px 0;
	}

	.wordmark a {
		border: none;
		display: block;
		color: var(--color-fg);
		background-image: none;
		transform: rotate(-4deg);
		transition: transform calc(var(--1s) * 0.25);
	}

	.wordmark a:hover {
		background-color: transparent;
		transform: rotate(0) scale(1.05);
	}
</style>
