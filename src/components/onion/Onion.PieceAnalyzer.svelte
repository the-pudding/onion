<script>
	import {
		cutWidthScale,
		numCuts,
		numLayers,
		rScale,
		yScale
	} from "$stores/onion";

	$: layerArcs = Array.from({ length: $numLayers + 1 }).map((_, i) => {
		const layerRadius = $rScale(i);

		return (x) => $yScale(Math.sqrt(layerRadius * layerRadius - x * x));
	});
</script>

{#each layerArcs as getYOnLayerArc}
	{#each { length: $numCuts } as _, i}
		{@const cutX = $cutWidthScale(i)}
		{@const cutY = getYOnLayerArc(cutX)}

		<!-- TODO plot a point at (cutX, 0) if cut doesn't intersect at layer arc -->
		{#if cutY}
			<circle r="3" cx={cutX} cy={cutY} />
		{/if}
	{/each}
{/each}
