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
