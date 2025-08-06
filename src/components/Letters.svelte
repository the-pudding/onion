<script>
	let { string, shrink, hed } = $props();

	let letters = $derived(string.split(""));

	const rotations = [-4, -2, 0, 2, 4];

	const getRandomIndex = (max) => {
		return Math.floor(Math.random() * max) + 1;
	};
</script>

<div class="letters" aria-label={string} class:hed class:shrink>
	{#each letters as letter, i}
		{#if letter !== " "}
			<img
				src="assets/letters/{letter}.png"
				alt="{letter} styled as an Onion"
				style="transform: rotate({rotations[
					getRandomIndex(rotations.length - 1)
				]}deg);"
			/>
		{:else}
			<span></span>
		{/if}
	{/each}
</div>

<style>
	.letters {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		margin: 2rem auto;
	}

	.letters.hed {
		margin: 0 auto;
	}

	img {
		height: min(11vw);
		min-height: 60px;
		max-height: 200px;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.06))
			drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06))
			drop-shadow(0 4px 4px rgba(0, 0, 0, 0.06));
	}
	.hed img {
		height: min(20vw);
	}

	span {
		display: inline-block;
		width: 3vw;
		min-width: 5px;
		max-width: 150px;
	}

	.letters.shrink {
		margin: -1rem auto;
		margin-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.letters.hed,
		.letters.shrink {
			margin: -1rem auto;
		}

		.letters.shrink {
			margin-bottom: 2rem;
		}

		span {
			display: inline-block;
			width: min(10vw, 20svh);
			min-width: 25px;
			max-width: 150px;
		}

		img {
			height: min(14vw, 20svh);
		}

		.hed img {
			height: min(30vw, 40svh);
			max-height: 300px;
		}
	}
</style>
