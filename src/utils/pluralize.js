const pr = new Intl.PluralRules("en-US");
const suffixes = new Map([
	["one", ""],
	["other", "s"]
]);

export function pluralize(noun, n) {
	const rule = pr.select(n);
	const suffix = suffixes.get(rule);
	return `${noun}${suffix}`;
}
