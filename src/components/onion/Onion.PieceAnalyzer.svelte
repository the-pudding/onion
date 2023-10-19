<script>
	import { numLayers, rScale, yScale } from "$stores/onion";

	$: layerArcs = Array.from({ length: $numLayers }).map((_, i) => {
		const layerRadius = $rScale(i + 1);

		return (x) => $yScale(Math.sqrt(layerRadius * layerRadius - x * x));
	});
</script>

{#each layerArcs as getYOnLayerArc}
	<circle r="3" cy={getYOnLayerArc(0)} />
{/each}
