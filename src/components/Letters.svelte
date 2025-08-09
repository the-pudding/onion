<script>
	let { string, shrink, hed } = $props();

	let words = $derived(string.split(" "));

	const rotations = [-4, -2, 0, 2, 4];

	const getRandomIndex = (max) => {
		return Math.floor(Math.random() * max) + 1;
	};
</script>

<div class="letters" aria-label={string} class:hed class:shrink>
	{#each words as word}
		<div class="word">
			{#each word as letter}
				<img
					src="assets/letters/{letter}.png"
					alt="{letter} styled as an Onion"
					style="transform: rotate({rotations[
						getRandomIndex(rotations.length - 1)
					]}deg);"
				/>
			{/each}
		</div>
	{/each}
</div>

<style>
	.letters {
		display: flex;
		justify-content: center;
		column-gap: 2rem;
		flex-wrap: wrap;
		margin-block: 2rem;
	}

	.hed {
		margin-block: 0;

		img {
			height: 20vw;
		}
	}

	.shrink {
		margin-block: -1rem 2rem;
	}

	.word {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
	}

	img {
		height: 11vw;
		min-height: 60px;
		max-height: 200px;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.06))
			drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06))
			drop-shadow(0 4px 4px rgba(0, 0, 0, 0.06));
	}

	@media (min-width: 640px) {
		.hed {
			margin-block: -1rem;

			img {
				height: min(30vw, 40svh);
				max-height: 300px;
			}
		}

		img {
			height: min(14vw, 20svh);
		}
	}
</style>
