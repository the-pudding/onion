import { scaleLinear } from "d3";
import { derived, readable, writable } from "svelte/store";

export const width = readable(600);
export const height = derived(width, ($width) => $width / 2);

const radiusPercentage = 0.8; // proportional to graph height
export const radius = derived(height, ($height) => $height * radiusPercentage);

export const numLayers = readable(10);

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
		Array.from({ length: $numLayers + 1 }).map((_, i) => $rScale(i))
);

export const numCuts = writable(10);

export const cutNumbers = derived(numCuts, ($numCuts) =>
	Array.from({ length: $numCuts }).map((_, i) => i)
);

export const cutWidthScale = derived([numCuts, radius], ([$numCuts, $radius]) =>
	scaleLinear().domain([0, $numCuts]).range([0, $radius])
);

export const cutAngleScale = derived(numCuts, ($numCuts) =>
	scaleLinear()
		.domain([0, $numCuts])
		.range([0, Math.PI / 2])
);
