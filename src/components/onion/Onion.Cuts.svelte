<script>
	import { getContext } from "svelte";
	import { polarToCartesian } from "$utils/math";

	export let width;
	export let height;
	export let yScale;

	const onionStore = getContext("onionStore");

	$: ({
		radius,
		cutNumbers,
		cutType,
		cutWidthScale,
		cutThickness,
		cutAngleScale,
		cutTargetDepth,
		horizontalCutNumbers,
		horizontalCutScale
	} = $onionStore);
</script>

<g class="cuts">
	{#each cutNumbers as i}
		{#if cutType === "vertical"}
			{@const x = cutWidthScale(i)}
			<line x1={x} y1="0" x2={x} y2={height} />

			<!-- TODO pass these paths to clipper-js to create piece paths based on intersections w/cuts -->
			<!-- <path d="M {x} {height} V 0 h {cutThickness} V {height} z" /> -->
		{:else if cutType === "radial"}
			{@const theta = cutAngleScale(i + 1)}

			{@const [xIntercept, yIntercept] = polarToCartesian(radius, theta)}

			<line
				x1={xIntercept * 2}
				y1={yScale(yIntercept * 2 + cutTargetDepth)}
				x2="0"
				y2={yScale(-cutTargetDepth)}
			/>

			<!-- TODO create radial paths as triangles -->
		{/if}
	{/each}

	{#each horizontalCutNumbers as i}
		{@const y = horizontalCutScale(i) * radius}
		{@const yNormalized = yScale(y)}
		<line x1="0" y1={yNormalized} x2={width / 2} y2={yNormalized} />
		<!-- TODO create horizontal paths as rectangles -->
		<text
			x="0"
			y={yNormalized}
			alignment-baseline="central"
			text-anchor="end"
			font-size="x-small"
		>
			horizontal cut at {y}
		</text>
	{/each}
</g>

<style>
	line {
		stroke-dasharray: 5;
	}

	/* path {
		fill: none;
		stroke-dasharray: 5;
		stroke: black;
	} */
</style>
