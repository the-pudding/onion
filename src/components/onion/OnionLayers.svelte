<script>
	import { getContext } from "svelte";

	export let height;

	const onionStore = getContext("onionStore");

	$: ({ layerRadii, layerThickness } = $onionStore);
</script>

<g class="onion">
	{#each layerRadii as r}
		<circle cx="0" cy={height} {r} />

		<!-- TODO pass these paths to clipper-js to create piece paths based on intersections w/cuts -->
		<!-- should keep drawing onion layers as circles, because drawing closed paths flush with each other has odd-looking antialiasing -->
		<!-- path is a semi-annulus, except for the innermost layer which is a semi-disk -->
		<!-- {@const previousRadius = r - layerThickness}
		<path
			d="M {r} {height} A {r} {r} 0 0 0 {-r} {height} H {-previousRadius} A {previousRadius} {previousRadius} 0 0 1 {previousRadius} {height} z"
		/> -->
	{/each}
</g>

<style>
	circle {
		fill: none;
		stroke: black;
	}

	/* path {
		fill: none;
		stroke: black;
	} */
</style>
