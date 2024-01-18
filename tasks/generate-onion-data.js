import path from "path";
import { writeFile } from "fs/promises";
import { get } from "svelte/store";
import {
	flattenRadialAreas,
	getRadialCutAreas,
	getVerticalAreas
} from "../src/utils/math.js";
import {
	cutTargetDepthPercentage,
	cutType,
	numCuts
} from "../src/stores/onion.js";
import { deviation, mean } from "d3";

const CWD = process.cwd();
const DATA_FILE_VERTICAL_RELATIVE = path.join(
	"src/data",
	"onion-piece-areas-vertical.json"
);
const DATA_FILE_VERTICAL = path.join(CWD, DATA_FILE_VERTICAL_RELATIVE);
const DATA_FILE_RADIAL_RELATIVE = path.join(
	"src/data",
	"onion-standard-deviation-radial.json"
);
const DATA_FILE_RADIAL = path.join(CWD, DATA_FILE_RADIAL_RELATIVE);
const MAX_CUTS = get(numCuts);

async function writeAllVerticalAreasToFile() {
	// mapping from $numCuts to pieceAreas objects
	const allVerticalAreas = {};

	for (let i = 1; i <= MAX_CUTS; i++) {
		numCuts.set(i);
		const pieceAreas = getVerticalAreas();
		allVerticalAreas[i] = pieceAreas;

		console.log(`\tFound vertical areas with numCuts = ${i}`);
	}

	try {
		await writeFile(DATA_FILE_VERTICAL, JSON.stringify(allVerticalAreas));

		console.log(`Wrote vertical areas to ${DATA_FILE_VERTICAL_RELATIVE}`);
	} catch (error) {
		console.error(error);
	}
}

// generate areas across all cut target depths
async function writeAllRadialAreasToFile() {
	const allRadialAreas = [];
	cutType.set("radial");

	for (let i = 0; i <= 1; i += 0.01) {
		cutTargetDepthPercentage.set(i);

		const radialAreas = getRadialCutAreas();
		const flattenedRadialAreas = flattenRadialAreas(radialAreas);
		const meanArea = mean(flattenedRadialAreas);
		const standardDeviation = deviation(flattenedRadialAreas);
		const rsd = (standardDeviation / meanArea) * 100;

		allRadialAreas.push({
			cutTargetDepthPercentage: i,
			rsd
		});

		console.log(`\tFound radial areas with cutTargetDepth = ${i}`);
	}

	try {
		await writeFile(DATA_FILE_RADIAL, JSON.stringify(allRadialAreas));

		console.log(`Wrote vertical areas to ${DATA_FILE_RADIAL_RELATIVE}`);
	} catch (error) {
		console.error(error);
	}
}

// TODO getAllRadialAreas will have to loop through both cutNumbers and cutTargetDepths
function getAllRadialAreas() {}
function getRadialAreas() {}

(async () => {
	// TODO do we still need this function?
	// await writeAllVerticalAreasToFile();
	await writeAllRadialAreasToFile();
})();
