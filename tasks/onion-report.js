import path from "path";
import { readFile, writeFile } from "fs/promises";
import {
	MAX_CUTS,
	MAX_LAYERS,
	MIN_CUTS,
	MIN_LAYERS
} from "../src/utils/constants.js";
import { quantile } from "d3";

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

// determine the quartiles we'll use to label RSD as very low, low, high, very high
// TODO run this after loading onion-standard-deviation.json in +page.svelte's load function
function findBuckets(data) {
	const standardDeviations = Object.values(data);
	const minStandardDeviation = Math.min(...standardDeviations);
	const q1StandardDeviation = quantile(standardDeviations, 0.25);
	const medianStandardDeviation = quantile(standardDeviations, 0.5);
	const q3StandardDeviation = quantile(standardDeviations, 0.75);
	const maxStandardDeviation = Math.max(...standardDeviations);

	console.log({
		minStandardDeviation,
		q1StandardDeviation,
		medianStandardDeviation,
		q3StandardDeviation,
		maxStandardDeviation
	});
}

(async () => {
	try {
		const inputFile = await readFile(
			path.join(DATA_DIRECTORY, "onion-standard-deviation.json")
		);
		const data = JSON.parse(inputFile);

		// await findMinimumStandardDeviations(data);

		// TODO find the median standard deviation, for determining RSD buckets
		findBuckets(data);
	} catch (error) {
		console.error(error);
	}
})();
