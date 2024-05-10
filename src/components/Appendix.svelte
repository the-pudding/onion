<script>
	import { getContext } from "svelte";

	const copy = getContext("copy");
</script>

<section class="appendix">
	{#each copy.appendix as { type, value }}
		<p class={type}>
			{@html value}
		</p>
	{/each}
</section>
