<script>
	export let height;
	export let numLayers;
	export let rScale;
</script>

<g class="onion">
	{#each { length: numLayers } as _, i}
		<circle cx="0" cy={height} r={rScale(i + 1)} />
	{/each}
</g>

<style>
	circle {
		fill: none;
		stroke: black;
	}
</style>
