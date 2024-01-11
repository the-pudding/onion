<script>
	import {
		cutTargetDepthPercentage,
		layerArcs,
		layerRadii,
		numCuts,
		numLayers,
		yScale
	} from "$stores/onion";
	import {
		formatPercentage,
		getRadialCutAreas,
		getVerticalAreas
	} from "$utils/math";
	import localStorage from "$utils/localStorage";

	export let cutType;

	let verticalPieceAreas, radialPieceAreas;

	$: key = [
		"areas",
		`${$numLayers}layers`,
		`${$numCuts}cuts`,
		cutType,
		...(cutType === "radial"
			? [`${formatPercentage($cutTargetDepthPercentage)}below`]
			: [])
	].join(":");

	$: readOrCalculateAreas = (areaFunction) => {
		let areas = localStorage.get(key);

		if (!areas) {
			areas = areaFunction();
			localStorage.set(key, areas);
		} else {
			// TODO remove log
			console.log("found localStorage areas!");
		}

		return areas;
	};

	$: if (cutType === "vertical") {
		verticalPieceAreas = readOrCalculateAreas(getVerticalAreas);
	} else if (cutType === "radial") {
		// TODO read radial piece areas from localStorage
		// if the below line is `radialPieceAreas = readOrCalculateAreas(getRadialCutAreas)`, this error is thrown:
		//   Uncaught (in promise) TypeError: child_ctx[22] is not a function
		//     at get_each_context_3 (Onion.PieceAnalyzer.svelte:89:32)
		//     at Object.update [as p] (Onion.PieceAnalyzer.svelte:87:9)
		//     at Object.update [as p] (Onion.PieceAnalyzer.svelte:75:8)
		//     at Object.update [as p] (Onion.PieceAnalyzer.svelte:74:31)
		//     at update (chunk-BU6ETVJE.js?v=dcda6272:1351:32)
		//     at flush (chunk-BU6ETVJE.js?v=dcda6272:1317:9)
		radialPieceAreas = getRadialCutAreas();
	}
</script>

{#if cutType === "vertical"}
	{#each verticalPieceAreas as { cutX, pieceColumn }}
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
	{#each radialPieceAreas as { layerRadius, layerArcFunction, pieces }}
		{@const numPieces = pieces.length}

		<text
			x="-10"
			y={$yScale(layerRadius)}
			text-anchor="end"
			alignment-baseline="middle"
		>
			{numPieces} piece{numPieces === 1 ? "" : "s"}
		</text>

		{#each pieces as { xOfLeftCutIntersection, xRange, area }}
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
