// convert boolean strings in value's object values to booleans;
//   leave other object values as-is
// ArchieML doesn't support booleans, only strings
// http://archieml.org/#demo
// value is a single-depth object returned by archieml
export default function getCopyObjectWithBooleans(value) {
	return Object.fromEntries(
		Object.entries(value).map(([k, v]) => [
			k,
			v === "true" ? true : v === "false" ? false : v
		])
	);
}
