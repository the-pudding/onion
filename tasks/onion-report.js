import path from "path";
import { readFile } from "fs/promises";

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

		// TODO import loop bounds from generate-onion-data.js
		for (let l = 7; l <= 13; l++) {
			for (let c = 1; c <= 10; c++) {
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
