<script>
	import { getContext } from "svelte";

	const copy = getContext("copy");
</script>

<section class="conclusion">
	{#each copy.conclusion as { type, value }}
		{@const isBlockquote = ["us", "kenji"].includes(type)}
		{@const wrapper = isBlockquote ? "blockquote" : "svelte:fragment"}

		<svelte:element this={wrapper}>
			<p class={type}>
				{#if isBlockquote}
					<b class="speaker">{type}:</b>
				{/if}

				{@html value}
			</p>
		</svelte:element>
	{/each}
</section>

<style>
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
