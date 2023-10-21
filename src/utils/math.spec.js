import { expect, test } from "vitest";
import { getVerticalCutArea } from "$utils/math";

const radius = 1;

test("calculates 0-width cut area", () => {
	const area = getVerticalCutArea(radius, 0, 0);

	expect(area).toBe(0);
});

test("calculates integral equal to quarter onion area", () => {
	const integralArea = getVerticalCutArea(radius, 0, radius);
	const geometricArea = (Math.PI * radius * radius) / 4;

	expect(integralArea).toBe(geometricArea);
});

test("limits of integration work as expected", () => {
	const totalArea = getVerticalCutArea(radius, 0, radius);
	const leftArea = getVerticalCutArea(radius, 0, radius / 2);
	const rightArea = getVerticalCutArea(radius, radius / 2, radius);

	expect(leftArea + rightArea).toBe(totalArea);
});
