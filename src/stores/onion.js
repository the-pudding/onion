import { formatPercentage } from "../utils/math.js";
import { scaleLinear } from "d3";
import { derived, writable } from "svelte/store";

export const width = writable(600);
export const height = derived(width, ($width) => $width / 2);

const radiusPercentage = 0.8; // proportional to graph height
export const radius = derived(height, ($height) => $height * radiusPercentage);

export const numLayers = writable(10);

// SVG drawing is flipped upside down
// need to use this function to normalize every linear (y = f(x)) function's output
export const yScale = derived(height, ($height) =>
	scaleLinear().domain([0, $height]).range([$height, 0])
);

export const rScale = derived([numLayers, radius], ([$numLayers, $radius]) =>
	scaleLinear().domain([0, $numLayers]).range([0, $radius])
);

export const layerRadii = derived(
	[numLayers, rScale],
	([$numLayers, $rScale]) =>
		Array.from({ length: $numLayers }).map((_, i) => $rScale(i + 1))
);

export const numCuts = writable(3);

export const cutNumbers = derived(numCuts, ($numCuts) =>
	Array.from({ length: $numCuts }).map((_, i) => i)
);

export const cutWidthScale = derived([numCuts, radius], ([$numCuts, $radius]) =>
	scaleLinear().domain([0, $numCuts]).range([0, $radius])
);

export const cutAngleScale = derived(numCuts, ($numCuts) =>
	scaleLinear()
		.domain([0, $numCuts])
		.range([Math.PI / 2, 0])
);

export const layerArcs = derived(layerRadii, ($layerRadii) =>
	$layerRadii.map((layerRadius) => (x) => Math.sqrt(layerRadius ** 2 - x ** 2))
);

export const cutTargetDepthPercentage = writable(0);

export const cutTargetDepth = derived(
	[radius, cutTargetDepthPercentage],
	([$radius, $cutTargetDepthPercentage]) => $radius * $cutTargetDepthPercentage
);

export const cutType = writable("vertical");

export const storageKey = derived(
	[numLayers, numCuts, cutType, cutTargetDepthPercentage],
	([$numLayers, $numCuts, $cutType, $cutTargetDepthPercentage]) =>
		[
			"areas",
			`${$numLayers}layers`,
			`${$numCuts}cuts`,
			$cutType,
			...($cutType === "radial"
				? [`${formatPercentage($cutTargetDepthPercentage)}below`]
				: [])
		].join(":")
);

export const numHorizontalCuts = writable(2);

export const horizontalCutNumbers = derived(
	numHorizontalCuts,
	($numHorizontalCuts) =>
		Array.from({ length: $numHorizontalCuts }).map((_, i) => i)
);

export const horizontalCutScale = derived(
	numHorizontalCuts,
	($numHorizontalCuts) =>
		scaleLinear()
			.domain([0, $numHorizontalCuts])
			.range([1 / ($numHorizontalCuts + 1), 1])
);
