import { readFile } from "fs/promises";

export async function load() {
	const inputFile = await readFile("src/data/onion-standard-deviation.json");
	const data = JSON.parse(inputFile);

	return { data };
}
