<script>
	import { getContext } from "svelte";

	const copy = getContext("copy");
</script>

<section class="intro">
	{#each copy.intro as { type, value }}
		<p class={type}>
			{@html value}
		</p>
	{/each}
</section>

<style>
	.intro p:last-of-type {
		position: relative;
	}

	.intro p:last-of-type::before {
		content: "";
		background: url("/assets/kenji.gif") no-repeat center;
		background-size: contain;
		width: 100px;
		height: 100px;
		display: inline-block;
		position: absolute;
		left: -120px;
		transform: rotate(-10deg);
	}

	@media (max-width: 850px) {
		.intro p:last-of-type::before {
			display: none;
		}
	}
</style>
