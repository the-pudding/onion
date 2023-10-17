import { expect, test } from "vitest";
import { getCircleTabArea } from "$utils/math";

test("calculates antiderivative equal to quarter onion area", () => {
	const radius = 1;
	const antiDerivativeArea = getCircleTabArea(radius);
	const geometricArea = (Math.PI * radius * radius) / 4;

	expect(antiDerivativeArea).toBe(geometricArea);
});
