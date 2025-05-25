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
	 */

	/** @type {Props} */
	let {
		area,
		layerNum,
		cutNum,
		subPieceIndex = undefined,
		highlight = false,
		primary = false,
		secondary = false
	} = $props();

	const subpiece = subPieceIndex !== undefined;
	const svgPadding = 1;

	const onionStore = getContext("onionStore");
	let { cutType, cutTargetDepthPercentage, meanArea, standardDeviation } =
		$derived($onionStore);

	const layerPathStore = getContext("layerPathStore");
	const cutPathStore = getContext("cutPathStore");
	const horizontalCutPathStore = getContext("horizontalCutPathStore");

	let layerPath = $derived($layerPathStore[layerNum]);
	let cutPath = $derived($cutPathStore[cutNum]);
	let piecePath = $derived(layerPath.intersect(cutPath));
	let subPiecePath = $derived(piecePath.intersect($horizontalCutPathStore[subPieceIndex]));
	let { width, height } = $derived(piecePath.strokeBounds);
	let d = $derived((subpiece ? subPiecePath : piecePath).pathData);

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
