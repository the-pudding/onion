import path from "path";
import { writeFile } from "fs/promises";
import { get } from "svelte/store";
import {
	flattenRadialAreas,
	flattenVerticalAreas,
	getRadialCutAreas,
	getVerticalAreas
} from "../src/utils/math.js";
import {
	cutTargetDepthPercentage,
	cutType,
	numCuts,
	numHorizontalCuts,
	numLayers,
	storageKey
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
const MAX_CUTS = 10;

async function writeAllVerticalAreasToFile() {
	// TODO also test horizontal cuts
	numHorizontalCuts.set(0);

	// mapping from $numCuts to pieceAreas objects
	const allVerticalAreas = {};

	for (let i = 7; i <= 13; i++) {
		numLayers.set(i);
		let minRSD = Infinity;
		let idealNumCuts = undefined;
		console.log(`\tnumLayers = ${i}`);

		for (let j = 1; j <= MAX_CUTS; j++) {
			numCuts.set(j);
			const $storageKey = get(storageKey);
			const pieceAreas = getVerticalAreas();
			const flattenedVerticalAreas = flattenVerticalAreas(pieceAreas);
			const meanArea = mean(flattenedVerticalAreas);
			const standardDeviation = deviation(flattenedVerticalAreas);
			const rsd = (standardDeviation / meanArea) * 100;

			allVerticalAreas[$storageKey] = { pieceAreas, meanArea, rsd };

			console.log(`\t\tFound vertical areas with numCuts = ${j}`);

			if (rsd < minRSD) {
				minRSD = rsd;
				idealNumCuts = j;
			}
		}

		console.log(`\t\tIdeal number of cuts: ${idealNumCuts}`);
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
	numCuts.set(10);
	numHorizontalCuts.set(0);

	for (let i = 0; i <= 100; i++) {
		const percentage = i / 100;
		cutTargetDepthPercentage.set(percentage);

		const radialAreas = getRadialCutAreas();
		const flattenedRadialAreas = flattenRadialAreas(radialAreas);
		const meanArea = mean(flattenedRadialAreas);
		const standardDeviation = deviation(flattenedRadialAreas);
		const rsd = (standardDeviation / meanArea) * 100;

		allRadialAreas.push({
			cutTargetDepthPercentage: percentage,
			rsd
		});

		console.log(`\tFound radial areas with cutTargetDepth = ${percentage}`);
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
	// await writeAllVerticalAreasToFile();
	await writeAllRadialAreasToFile();
})();
