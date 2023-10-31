import path from "path";
import { writeFile } from "fs/promises";
import { get } from "svelte/store";
import {
	cutNumbers,
	cutWidthScale,
	layerRadii,
	numCuts
} from "../src/stores/onion.js";
import { getVerticalCutArea } from "../src/utils/math.js";

const CWD = process.cwd();
const DATA_FILE_RELATIVE = path.join("src/data", "onion-piece-areas.json");
const DATA_FILE = path.join(CWD, DATA_FILE_RELATIVE);
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
		await writeFile(DATA_FILE, JSON.stringify(allVerticalAreas));

		console.log(`Wrote vertical areas to ${DATA_FILE_RELATIVE}`);
	} catch (error) {
		console.error(error);
	}
}

function getVerticalAreas() {
	const $cutNumbers = get(cutNumbers);
	const $cutWidthScale = get(cutWidthScale);
	const $layerRadii = get(layerRadii);

	// pieceAreas is a 2D array whose major index corresponds to cutNumbers
	// the minor index (for pieceColumn array) corresponds to piece index within a column of pieces,
	//   counted from the bottom upward
	const pieceAreas = $cutNumbers.map((i) => ({
		cutX: $cutWidthScale(i),
		pieceColumn: []
	}));

	$cutNumbers.forEach((i) => {
		const { cutX, pieceColumn } = pieceAreas[i];

		$layerRadii.forEach((layerRadius) => {
			if (layerRadius > cutX) {
				const nextCutX = $cutWidthScale(i + 1);
				const verticalCutArea = getVerticalCutArea(layerRadius, cutX, nextCutX);
				const pieceArea = pieceColumn.length
					? verticalCutArea - pieceColumn.at(-1).verticalCutArea
					: verticalCutArea;

				pieceColumn.push({ layerRadius, verticalCutArea, pieceArea });
			}
		});
	});

	return pieceAreas;
}

// TODO getAllRadialAreas will have to loop through both cutNumbers and cutTargetDepths
function getAllRadialAreas() {}
function getRadialAreas() {}

(async () => {
	await writeAllVerticalAreasToFile();
})();
