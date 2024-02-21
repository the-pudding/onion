import path from "path";
import { writeFile } from "fs/promises";
import { get } from "svelte/store";
import {
	flattenRadialAreas,
	flattenVerticalAreas,
	getRadialCutAreas,
	getVerticalAreas,
	roundToDecimalPlaces
} from "../src/utils/math.js";
import {
	cutTargetDepthPercentage,
	cutType,
	numCuts,
	numHorizontalCuts,
	numLayers,
	storageKey
} from "../src/stores/onion.js";
import { deviation, format, mean } from "d3";

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
const DATA_FILE_STANDARD_DEVIATION_RELATIVE = path.join(
	"src/data",
	"onion-standard-deviation.json"
);
const DATA_FILE_STANDARD_DEVIATION = path.join(
	CWD,
	DATA_FILE_STANDARD_DEVIATION_RELATIVE
);
export const MIN_LAYERS = 7;
export const MAX_LAYERS = 13;
export const MIN_CUTS = 1;
export const MAX_CUTS = 10;
const MIN_HORIZONTAL_CUTS = 0;
const MAX_HORIZONTAL_CUTS = 2;

async function writeAllVerticalAreasToFile() {
	numHorizontalCuts.set(0);

	// mapping from $numCuts to pieceAreas objects
	const allVerticalAreas = {};

	for (let i = MIN_LAYERS; i <= MAX_LAYERS; i++) {
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

async function writeAllStandardDeviationsToFile() {
	let standardDeviations = {};

	function addRSDData() {
		standardDeviations = {
			...standardDeviations,
			...getRelativeStandardDeviation()
		};
	}

	for (let l = MIN_LAYERS; l <= MAX_LAYERS; l++) {
		numLayers.set(l);

		for (let c = MIN_CUTS; c <= MAX_CUTS; c++) {
			numCuts.set(c);

			for (let h = MIN_HORIZONTAL_CUTS; h <= MAX_HORIZONTAL_CUTS; h++) {
				numHorizontalCuts.set(h);

				// get standard deviation data for vertical cuts
				cutType.set("vertical");
				addRSDData();

				// get standard deviation data for radial cuts
				cutType.set("radial");
				const depthMax = c > 1 ? 100 : 0;

				for (let d = 0; d <= depthMax; d++) {
					cutTargetDepthPercentage.set(d / 100);
					const $storageKey = get(storageKey);
					console.log({ $storageKey });
					addRSDData();
				}
			}
		}

		// TODO for this number of layers, where does the minimum standard deviation occur?
	}

	try {
		await writeFile(
			DATA_FILE_STANDARD_DEVIATION,
			JSON.stringify(standardDeviations)
		);

		console.log(`Wrote standard deviations to ${DATA_FILE_STANDARD_DEVIATION}`);
	} catch (error) {
		console.error(error);
	}
}

function getRelativeStandardDeviation() {
	const $storageKey = get(storageKey);
	const $cutType = get(cutType);
	const pieceAreas =
		$cutType === "vertical" ? getVerticalAreas() : getRadialCutAreas();
	const flattenedAreas =
		$cutType === "vertical"
			? flattenVerticalAreas(pieceAreas)
			: flattenRadialAreas(pieceAreas);
	const meanArea = mean(flattenedAreas);
	const standardDeviation = deviation(flattenedAreas);
	const rsd = (standardDeviation / meanArea) * 100;

	return { [$storageKey]: +format(".3f")(rsd) };
}

(async () => {
	// await writeAllVerticalAreasToFile();
	// await writeAllRadialAreasToFile();
	await writeAllStandardDeviationsToFile();
})();
