import path from "path";
import { readFile } from "fs/promises";
import {
	MAX_CUTS,
	MAX_LAYERS,
	MIN_CUTS,
	MIN_LAYERS
} from "../src/utils/constants.js";

const CWD = process.cwd();
const DATA_DIRECTORY = path.join(CWD, "src/data");

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

(async () => {
	try {
		const file = await readFile(
			path.join(DATA_DIRECTORY, "onion-standard-deviation.json")
		);
		const data = JSON.parse(file);

		for (let l = MIN_LAYERS; l <= MAX_LAYERS; l++) {
			for (let c = MIN_CUTS; c <= MAX_CUTS; c++) {
				const configurationData = getConfigurationData({
					data,
					numLayers: l,
					numCuts: c
				});
				const e = getEntryWithMinimumValue(configurationData);
				console.log(e);
			}
		}
	} catch (error) {
		console.error(error);
	}
})();
