<script>
	import { getContext } from "svelte";

	export let area;
	export let layerNum;
	export let cutNum;
	export let subPieceIndex = undefined;
	export let highlight = false;
	export let primary = false;
	export let secondary = false;

	const subpiece = subPieceIndex !== undefined;
	const svgPadding = 1;

	const onionStore = getContext("onionStore");
	$: ({ cutType, cutTargetDepthPercentage, meanArea, standardDeviation } =
		$onionStore);

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");

	$: layerPath = $layerPathStore[layerNum];
	$: cutPath = $cutPathStore[cutNum];
	$: piecePath = layerPath.intersect(cutPath);
	$: subPiecePath = piecePath.intersect($horizontalCutPathStore[subPieceIndex]);
	$: ({ width, height } = piecePath.strokeBounds);
	$: d = (subpiece ? subPiecePath : piecePath).pathData;

	const explodeStore = getContext("explodeStore");

	const colorScaleStore = getContext("colorScaleStore");
</script>

<!-- TODO can we prevent highlighted pieces next to y-axis from being truncated on the left? -->
<!--   (involves setting viewBox when $explodeStore === false) -->
<!--   (requires us to manually position each piece's SVG element) -->
<svg
	viewBox={$explodeStore
		? `${-svgPadding} ${-svgPadding} ${width + 2 * svgPadding} ${
				height + 2 * svgPadding
		  }`
		: undefined}
	width={$explodeStore ? width : undefined}
>
	<!-- {#if subpiece}
		{@debug piecePath, subPiecePath, d, area}
	{/if} -->
	<path
		{d}
		style={$explodeStore
			? `stroke: ${$colorScaleStore(
					Math.abs(area - meanArea) / standardDeviation
			  )}; transform: translate(${width / 2 - piecePath.position.x}px, ${
					height / 2 - piecePath.position.y
			  }px)`
			: undefined}
		class:highlight
		class:primary={highlight && primary}
		class:secondary={highlight && secondary}
		class:thin={!$explodeStore &&
			secondary &&
			cutType === "radial" &&
			cutTargetDepthPercentage === 0}
		class:subpiece
		data-area={area}
	/>
</svg>

<style>
	/**
	* TODO transform transition looks interesting,
	* but is there a way to animate transition between exploded and not exploded?
	*/
	path {
		fill: none;
		stroke: transparent;
		transition:
			stroke 200ms 200ms,
			transform 200ms;

		&.highlight {
			stroke-width: 4px;
		}

		&.thin {
			stroke-width: 2px;
		}

		&.subpiece {
			stroke: blue;
		}
	}

	:global(figure:not(.explode) .subpiece) {
		stroke-width: 2px;
	}

	:global(figure.explode path) {
		stroke: black;
		transition:
			stroke 200ms,
			transform 200ms;
	}
</style>
