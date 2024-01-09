<script>
	import {
		cutTargetDepth,
		layerArcs,
		layerRadii,
		numCuts,
		numLayers,
		yScale
	} from "$stores/onion";
	import ALL_VERTICAL_AREAS from "$data/onion-piece-areas.json";
	import { getRadialCutAreas } from "$utils/math";

	export let cutType;

	// TODO cache pieceAreas in localStorage for demo parameters we've set before
	// TODO how to re-calculate radial pieceAreas when numLayers changes, without passing numLayers as an arg?
	$: pieceAreas =
		cutType === "vertical"
			? ALL_VERTICAL_AREAS[$numCuts]
			: getRadialCutAreas($cutTargetDepth, $numLayers);

	// $: console.log({ pieceAreas });
</script>

{#if cutType === "vertical"}
	{#each pieceAreas as { cutX, pieceColumn }}
		<text x={cutX} y={$yScale(0)} font-size="x-small">
			{pieceColumn.length}x
		</text>

		{#each pieceColumn as { layerRadius, pieceArea }, layerNum}
			{@const getYOnLayerArc = $layerArcs.filter(
				(_, arcNum) => $layerRadii[arcNum] > cutX
			)[layerNum]}
			{@const cutY = $yScale(getYOnLayerArc(cutX))}

			<text x={cutX} y={cutY} font-size="x-small">
				{Math.round(pieceArea)}
			</text>

			<circle r="2" cx={cutX} cy={cutY} />
		{/each}
	{/each}
{:else if cutType === "radial"}
	{#each pieceAreas as { layerRadius, layerArcFunction, pieces }}
		{@const numPieces = pieces.length}

		<text
			x="-10"
			y={$yScale(layerRadius)}
			text-anchor="end"
			alignment-baseline="middle"
		>
			{numPieces} piece{numPieces === 1 ? "" : "s"}
		</text>

		{#each pieces as { xOfLeftCutIntersection, xRange, area }, pieceNum}
			{@const x = xOfLeftCutIntersection}
			{@const y = layerArcFunction(x)}
			{@const yNormalized = $yScale(y)}

			<!-- <text {x} y={yNormalized} font-size="x-small">
				({Math.round(x)}, {Math.round(y)})
			</text> -->
			<text {x} y={yNormalized} font-size="x-small">
				{Math.round(area)}
			</text>

			<circle cx={x} cy={yNormalized} r="2" />

			<!-- {@const markerY = $yScale(layerArcFunction(xOfLeftCutIntersection))} -->
			<!-- <text {x} y={markerY} font-size="x-small">
				[{Math.round(xRange[0])}, {Math.round(xRange[1])}]
			</text> -->

			<!-- <line
				x1={xRange[0]}
				y1={markerY}
				x2={xRange[1]}
				y2={markerY}
				stroke-width="2"
				style="stroke: red"
			/> -->
		{/each}
	{/each}
{/if}
