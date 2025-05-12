<script>
	import { getContext } from "svelte";

	/**
	 * @typedef {Object} Props
	 * @property {number} index
	 * @property {any} area
	 * @property {any} layerNum
	 * @property {any} cutNum
	 * @property {any} [subPieceIndex]
	 * @property {boolean} [highlight]
	 * @property {boolean} [primary]
	 * @property {boolean} [secondary]
	 * @property {number} explodedRowY
	 */

	/** @type {Props} */
	let {
		index,
		area,
		layerNum,
		cutNum,
		subPieceIndex = undefined,
		highlight = false,
		primary = false,
		secondary = false,
		explodedRowY
	} = $props();

	const subpiece = subPieceIndex !== undefined;
	const svgPadding = 1;

	const onionStore = getContext("onionStore");
	let { cutType, cutTargetDepthPercentage, meanArea, standardDeviation } =
		$derived($onionStore);

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");

	// TODO this intersection logic was moved to OnionPieceAnalyzer;
	//   it can be removed from here after radial pieces can smoothly transition to exploded
	let layerPath = $derived($layerPathStore[layerNum]);
	let cutPath = $derived($cutPathStore[cutNum]);
	let piecePath = $derived(layerPath.intersect(cutPath));
	let subPiecePath = $derived(
		piecePath.intersect($horizontalCutPathStore[subPieceIndex])
	);
	let { width, height } = $derived(piecePath.strokeBounds);
	let d = $derived((subpiece ? subPiecePath : piecePath).pathData);

	const explodeStore = getContext("explodeStore");

	const colorScaleStore = getContext("colorScaleStore");

	let explodedX = $derived(
		width / 2 - piecePath.position.x - 300 + width * index
	);
	let explodedY = $derived(height / 2 - piecePath.position.y + explodedRowY);
</script>

<!-- {#if subpiece}
		{@debug piecePath, subPiecePath, d, area}
	{/if} -->
<path
	{d}
	style={$explodeStore
		? `stroke: ${$colorScaleStore(
				Math.abs(area - meanArea) / standardDeviation
		  )}; transform: translate(${explodedX}px, ${explodedY}px)`
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

<style>
	path {
		fill: none;
		stroke: transparent;
		transition:
			stroke var(--duration-transform) var(--duration-transform),
			transform var(--duration-transform);

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
			transform var(--duration-transform);
	}
</style>
