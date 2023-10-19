import { scaleLinear } from "d3";
import { derived, readable, writable } from "svelte/store";

export const width = readable(600);
export const height = derived(width, ($width) => $width / 2);

const radiusPercentage = 0.8; // proportional to graph height
export const radius = derived(height, ($height) => $height * radiusPercentage);

export const numLayers = readable(10);

export const rScale = derived([numLayers, radius], ([$numLayers, $radius]) => {
	return scaleLinear().domain([0, $numLayers]).range([0, $radius]);
});

export const numCuts = writable(10);

export const cutWidthScale = derived([numCuts, radius], ([$numCuts, $radius]) =>
	scaleLinear().domain([0, $numCuts]).range([0, $radius])
);

export const cutAngleScale = derived(numCuts, ($numCuts) =>
	scaleLinear()
		.domain([0, $numCuts])
		.range([0, Math.PI / 2])
);
