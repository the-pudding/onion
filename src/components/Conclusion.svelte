<script>
	import { getContext } from "svelte";
	import Letters from "$components/Letters.svelte";

	const copy = getContext("copy");
</script>

<section class="conclusion">
	<h2>The importance of optimal</h2>
	<Letters string="TECHNIQUE" height={100}/>
	{#each copy.conclusion as { type, value }}
		{@const isBlockquote = ["us", "kenji"].includes(type)}
		{@const wrapper = isBlockquote ? "blockquote" : "svelte:fragment"}

			<p class={type}>
				{#if isBlockquote}
					<b class="speaker">{type}:</b>
				{/if}

				{@html value}
			</p>
	{/each}
</section>

<style>
	h2 {
		text-align: center;
		margin-top: 4rem;
	}
	.conclusion p:nth-of-type(3) {
		position: relative;
	}

	.conclusion p:nth-of-type(3)::before {
		content: "";
		background: url("./assets/kenji.gif") no-repeat center;
		background-size: contain;
		width: 100px;
		height: 100px;
		display: inline-block;
		position: absolute;
		left: -120px;
		transform: rotate(-10deg);
	}

	.speaker {
		text-transform: capitalize;
	}

	blockquote :global(em),
	.note {
		color: var(--color-primary);
	}

	.note {
		font-size: var(--12px);
	}
</style>
