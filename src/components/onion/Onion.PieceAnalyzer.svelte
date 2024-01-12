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
		}

		return areas;
	};

	$: if (cutType === "vertical") {
		verticalPieceAreas = readOrCalculateAreas(getVerticalAreas);
	} else if (cutType === "radial") {
		radialPieceAreas = readOrCalculateAreas(getRadialCutAreas);
	}
</script>

{#if cutType === "vertical"}
	{#each verticalPieceAreas as { cutX, pieceColumn }}
		<text x={cutX} y={$yScale(0)} font-size="x-small">
			{pieceColumn.length}x
		</text>

		{#each pieceColumn as { layerRadius, pieceArea }, layerNum}
			{@const layerArcFunction = $layerArcs.filter(
				(_, arcNum) => $layerRadii[arcNum] > cutX
			)[layerNum]}
			{@const cutY = $yScale(layerArcFunction(cutX))}

			<text x={cutX} y={cutY} font-size="x-small">
				{Math.round(pieceArea)}
			</text>

			<circle r="2" cx={cutX} cy={cutY} />
		{/each}
	{/each}
{:else if cutType === "radial"}
	{#each radialPieceAreas as { layerRadius, pieces }, layerNum}
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
			{@const layerArcFunction = $layerArcs[layerNum]}
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
