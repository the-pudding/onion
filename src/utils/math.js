import { format } from "d3";

export function formatPercentageAsNegative(n) {
	return format(".0%")(-n);
}

// TODO for a single vertical cut (i.e., cutting the onion half in half),
//   getCircleTabArea = integral of circle height from 0 to r, dx (in first quadrant)
//   https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/28c569c5d8e79b7e1a2be1755de42d25_MIT18_01SCF10_Ses70a.pdf
//   the expression used for getCircleTabArea here is an antiderivative F(x), and will need to have limits of integration applied as in F(b) - F(a)
//     right now F(x) is F(verticalCutThickness) - F(0)
export function getCircleTabArea(radius, verticalCutThickness = radius) {
	return (
		(radius * radius * Math.asin(verticalCutThickness / radius) +
			verticalCutThickness *
				Math.sqrt(
					radius * radius - verticalCutThickness * verticalCutThickness
				)) /
		2
	);
}
