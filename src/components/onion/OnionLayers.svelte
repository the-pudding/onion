<script>
	import { getContext } from "svelte";

	export let height;

	const onionStore = getContext("onionStore");

	$: ({ layerRadii } = $onionStore);
</script>

<g class="onion">
	{#each layerRadii as r}
		<circle cx="0" cy={height} {r} />
	{/each}
</g>

<style>
	circle {
		fill: none;
		stroke: black;
	}
</style>
