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
		cutAngleScale,
		cutTargetDepth,
		horizontalCutNumbers,
		horizontalCutScale
	} = $onionStore);

	const horizontalCutPathStore = getContext("horizontalCutPathStore");
</script>

<g class="cuts">
	{#each cutNumbers as i}
		{#if cutType === "vertical"}
			{@const x = cutWidthScale(i)}
			<line x1={x} y1="0" x2={x} y2={height} />
		{:else if cutType === "radial"}
			{@const theta = cutAngleScale(i + 1)}
			{@const [xIntercept, yIntercept] = polarToCartesian(radius, theta)}

			<line
				x1={xIntercept * 2}
				y1={yScale(yIntercept * 2 + cutTargetDepth)}
				x2="0"
				y2={yScale(-cutTargetDepth)}
			/>
		{/if}
	{/each}

	{#each horizontalCutNumbers as i}
		{@const y = horizontalCutScale(i) * radius}
		{@const yNormalized = yScale(y)}
		<line x1="0" y1={yNormalized} x2={width / 2} y2={yNormalized} />
		<!-- TODO remove debugging element for path -->
		<path d={$horizontalCutPathStore[i].pathData} />
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

	path {
		/* fill: none; */
		stroke-dasharray: 5;
	}
</style>
