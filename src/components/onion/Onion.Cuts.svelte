<script>
	import { polarToCartesian } from "$utils/math";
	import {
		cutAngleScale,
		cutWidthScale,
		yScale,
		cutNumbers,
		cutTargetDepth,
		cutType,
		horizontalCutScale,
		width,
		horizontalCutNumbers
	} from "$stores/onion";

	export let height;
	export let radius;
</script>

<g class="cuts">
	{#each $cutNumbers as i}
		{#if $cutType === "vertical"}
			{@const x = $cutWidthScale(i)}
			<path d="M {x} 0 v {height}" />
		{:else if $cutType === "radial"}
			{@const theta = $cutAngleScale(i + 1)}

			<!-- where cut intercepts onion's outermost layer -->
			{@const [xIntercept, yIntercept] = polarToCartesian(radius, theta)}

			<path
				d="M {xIntercept * 2} {$yScale(
					yIntercept * 2 + $cutTargetDepth
				)} L 0 {$yScale(-$cutTargetDepth)}"
			/>
		{/if}
	{/each}

	{#each $horizontalCutNumbers as i}
		{@const y = $horizontalCutScale(i) * radius}
		{@const yNormalized = $yScale(y)}
		<path d="M 0 {yNormalized} h {$width / 2}" />
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
	path {
		stroke-dasharray: 5;
	}
</style>
