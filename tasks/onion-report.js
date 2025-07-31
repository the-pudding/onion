import path from "path";
import { readFile, writeFile } from "fs/promises";
import {
	MAX_CUTS,
	MAX_LAYERS,
	MIN_CUTS,
	MIN_LAYERS
} from "../src/utils/constants.js";

const CWD = process.cwd();
const DATA_DIRECTORY = path.join(CWD, "src/data");
const outputFilename = path.join(DATA_DIRECTORY, "onion-report.json");

function getConfigurationData({ data, numLayers, numCuts }) {
	return Object.fromEntries(
		Object.entries(data).filter(([key]) =>
			key.includes(`${numLayers}l:${numCuts}c`)
		)
	);
}

function getEntryWithMinimumValue(data) {
	const minimumValue = Math.min(...Object.values(data));
	return Object.entries(data).find(([, value]) => value === minimumValue);
}

// find the minimum standard deviations for every layer/cut combo + how to obtain it
//   (vertical, radial / what depth, horizontal if any)
async function findMinimumStandardDeviations(data) {
	let reportData = [];

	for (let l = MIN_LAYERS; l <= MAX_LAYERS; l++) {
		for (let c = MIN_CUTS; c <= MAX_CUTS; c++) {
			const configurationData = getConfigurationData({
				data,
				numLayers: l,
				numCuts: c
			});
			const e = getEntryWithMinimumValue(configurationData);
			reportData.push(e);
		}
	}

	await writeFile(outputFilename, JSON.stringify(reportData), "utf8");

	console.log(`Wrote onion report to ${outputFilename}`);
}

(async () => {
	try {
		const inputFile = await readFile(
			path.join(DATA_DIRECTORY, "onion-standard-deviation.json")
		);
		const data = JSON.parse(inputFile);

		await findMinimumStandardDeviations(data);

		// TODO find the min, max, and median standard deviations, for determining RSD buckets
	} catch (error) {
		console.error(error);
	}
})();
