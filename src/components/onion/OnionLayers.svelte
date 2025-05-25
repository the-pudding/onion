<script>
	import { getContext } from "svelte";

	let { height } = $props();

	const onionStore = getContext("onionStore");

	let { layerRadii } = $derived($onionStore);
</script>

<g class="onion">
	{#each layerRadii as r}
		<!-- even though we have paths in layerPathStore, we should draw onion layers as circles, because drawing closed paths flush with each other has odd-looking antialiasing -->
		<circle cx="0" cy={height} {r} clip-path="url(#layer-mask)" />
	{/each}
</g>

<style>
	circle {
		fill: none;
	}
</style>
