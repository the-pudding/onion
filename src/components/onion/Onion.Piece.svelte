<script>
	import { getContext } from "svelte";

	/**
	 * @typedef {Object} Props
	 * @property {any} area
	 * @property {any} layerNum
	 * @property {any} cutNum
	 * @property {any} [subPieceIndex]
	 * @property {boolean} [highlight]
	 * @property {boolean} [primary]
	 * @property {boolean} [secondary]
	 * @property {number} explodedX
	 * @property {number} explodedRowY
	 */

	/** @type {Props} */
	let {
		area,
		layerNum,
		cutNum,
		subPieceIndex = undefined,
		highlight = false,
		primary = false,
		secondary = false,
		explodedX,
		explodedRowY
	} = $props();

	const subpiece = subPieceIndex !== undefined;
	const svgPadding = 1;

	const onionStore = getContext("onionStore");
	let {
		cutType,
		cutTargetDepthPercentage,
		meanArea,
		standardDeviation,
		numHorizontalCuts
	} = $derived($onionStore);

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

	let explodedY = $derived.by(() => {
		let explodedY = height / 2 - piecePath.position.y + explodedRowY;

		// shift lower subpieces upward
		// TODO handle an arbitrary number of h-cuts

		// handle 1 h-cut
		if (subPieceIndex === 0) {
			const upperSubPiecePath = piecePath.intersect($horizontalCutPathStore[1]);
			explodedY -= upperSubPiecePath.strokeBounds.height;
		}

		// handle 2 h-cuts
		if (numHorizontalCuts === 2 && subPieceIndex < 2) {
			const topSubPiecePath = piecePath.intersect($horizontalCutPathStore[2]);
			explodedY -= topSubPiecePath.strokeBounds.height;
		}

		return explodedY;
	});
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
	data-subpiece-index={subPieceIndex}
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
			stroke var(--duration-fade),
			transform var(--duration-transform) var(--duration-fade);
	}
</style>
