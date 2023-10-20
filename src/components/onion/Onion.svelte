<script>
	import { layerRadii } from "$stores/onion";

	export let height;
</script>

<g class="onion">
	{#each $layerRadii as r}
		<circle cx="0" cy={height} {r} />
	{/each}
</g>

<style>
	circle {
		fill: none;
		stroke: black;
	}
</style>
