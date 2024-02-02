import {
	cutAngleScale,
	cutNumbers,
	cutTargetDepth,
	cutWidthScale,
	horizontalCutNumbers,
	horizontalCutScale,
	layerRadii,
	radius
} from "../stores/onion.js";
import { format } from "d3";
import { get } from "svelte/store";

export function formatPercentage(n) {
	return format(".0%")(n);
}

export function polarToCartesian(r, theta) {
	return [r * Math.sin(theta), r * Math.cos(theta)];
}

// https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/28c569c5d8e79b7e1a2be1755de42d25_MIT18_01SCF10_Ses70a.pdf
// following a similar derivation to the paper above,
// getVerticalCutArea returns the area of a vertical slice of a quarter circle in the first quadrant,
//   starting from x = 0
//   i.e., integral of sqrt(radius ** 2 - x ** 2)dx, from x1 to x2
// the antiderivative of this is (-1/2 * r ** 2) * (theta - sin(theta) * cos(theta)),
// where theta is arccos(x/r)
export function getVerticalCutArea(radius, x1, x2) {
	// acos' domain is [-1, 1], so acos of anything > 1 will return NaN
	x2 = Math.min(x2, radius);

	function getTheta(x) {
		return Math.acos(x / radius);
	}

	function getAntiderivative(theta) {
		return (-1 / 2) * radius ** 2 * (theta - Math.sin(theta) * Math.cos(theta));
	}

	return getAntiderivative(getTheta(x2)) - getAntiderivative(getTheta(x1));
}

function getVerticalCutAreaAboveHorizontalLine({
	layerRadius,
	cutY,
	cutX,
	nextCutX
}) {
	const xWhereHorizontalCutIntersectsThisLayer = Math.sqrt(
		layerRadius ** 2 - cutY ** 2
	);
	const xUpperBound = Math.min(
		xWhereHorizontalCutIntersectsThisLayer,
		nextCutX
	);

	return (
		getVerticalCutArea(layerRadius, cutX, xUpperBound) -
		(xUpperBound - cutX) * cutY
	);
}

export function getVerticalAreas() {
	const $cutNumbers = get(cutNumbers);
	const $cutWidthScale = get(cutWidthScale);
	const $radius = get(radius);
	const $layerRadii = get(layerRadii);
	const $horizontalCutNumbers = get(horizontalCutNumbers);
	const $horizontalCutScale = get(horizontalCutScale);

	// with vertical cuts, pieceAreas is a 2D array whose major index corresponds to cutNumbers
	// the minor index (for pieceColumn array) corresponds to piece index within a column of pieces,
	//   counted from the bottom upward
	const pieceAreas = $cutNumbers.map((i) => ({
		cutX: $cutWidthScale(i),
		pieceColumn: []
	}));

	$cutNumbers.forEach((cutNum) => {
		const { cutX, pieceColumn } = pieceAreas[cutNum];

		$layerRadii.forEach((layerRadius, layerNum) => {
			const isFirstLayer = layerNum === 0;
			const previousLayerRadius = $layerRadii[layerNum - 1];

			if (layerRadius > cutX) {
				const nextCutX = $cutWidthScale(cutNum + 1);
				const verticalCutArea = getVerticalCutArea(layerRadius, cutX, nextCutX);
				const pieceArea = pieceColumn.length
					? verticalCutArea - pieceColumn.at(-1).verticalCutArea
					: verticalCutArea;

				// y-range is necessary for finding piece areas created by horizontal cuts
				const yRange = [
					isFirstLayer
						? 0
						: Math.sqrt(previousLayerRadius ** 2 - nextCutX ** 2) || 0,
					Math.sqrt(layerRadius ** 2 - cutX ** 2)
				];

				// horizontal cuts that intersect this piece will create subpieces
				let subPieces = [];

				$horizontalCutNumbers.forEach((horizontalCutNum) => {
					const cutY = $horizontalCutScale(horizontalCutNum) * $radius;

					// this horizontal cut intersects this piece
					if (isInRange(cutY, yRange[0], yRange[1])) {
						let upperPieceArea = getVerticalCutAreaAboveHorizontalLine({
							layerRadius,
							cutY,
							cutX,
							nextCutX
						});
						const yWhereLeftCutIntersectsPreviousLayer = Math.sqrt(
							previousLayerRadius ** 2 - cutX ** 2
						);

						// this horizontal cut also intersects the piece below
						if (cutY < yWhereLeftCutIntersectsPreviousLayer) {
							upperPieceArea -= getVerticalCutAreaAboveHorizontalLine({
								layerRadius: previousLayerRadius,
								cutY,
								cutX,
								nextCutX
							});
						}

						if (subPieces.length) {
							// add the third piece on the bottom
							// in this block, upperPieceArea is actually the top 2/3 pieces' area
							const topPieceArea = subPieces[0];

							subPieces = [
								topPieceArea,
								upperPieceArea - topPieceArea,
								pieceArea - upperPieceArea
							];
						} else {
							// add a top piece and a bottom piece
							subPieces = [upperPieceArea, pieceArea - upperPieceArea];
						}
					}
				});

				pieceColumn.push({
					layerRadius,
					verticalCutArea,
					pieceArea,
					yRange,
					subPieces
				});
			}
		});
	});

	return pieceAreas;
}

// getRadialCutArea returns the area of a radial slice in the first quadrant
//   i.e., double integral: (r dr, from radius1 to radius2) d theta, from theta1 to theta2
// only applies if cutTargetDepth === 0
export function getRadialCutAreaPolar({
	radius1 = 0,
	radius2,
	theta1 = 0,
	theta2
}) {
	return (1 / 2) * (radius2 ** 2 - radius1 ** 2) * (theta2 - theta1);
}

// discriminant is obtained from quadratic formula,
//   when setting circle function equal to line function to find intersection
export function doesLineIntersectCircleAboveXAxis({
	slope,
	yIntercept,
	radius
}) {
	const discriminant =
		yIntercept ** 2 * slope ** 2 -
		(slope ** 2 + 1) * (yIntercept ** 2 - radius ** 2);

	return { discriminant, doesIntersect: discriminant > 0 };
}

// getAreaUnderLine returns the area under a line defined by y = mx + b
export function getAreaUnderLine({ slope, yIntercept, x1, x2 }) {
	return (1 / 2) * slope * (x2 ** 2 - x1 ** 2) + yIntercept * (x2 - x1);
}

// calculating yRange with Math.sqrt is prone to rounding errors
// e.g., yRange[1] may be evaluated as 80.00000000000003, for the last (rightmost) piece of
//   the middle layer given { numLayers: 3, numCuts: 3, cutType: "radial", cutTargetDepth: 0 };
//   without this function, 80 will be considered to be within yRange, which should be exclusive
export function isInRange(n, min, max) {
	const tolerance = 3e-14;

	return n > min && n - min > tolerance && n < max && max - n > tolerance;
}

export function getRadialCutAreas() {
	const $layerRadii = get(layerRadii);
	const $cutAngleScale = get(cutAngleScale);
	const $radius = get(radius);
	const $cutNumbers = get(cutNumbers);
	const $cutTargetDepth = get(cutTargetDepth);
	const $horizontalCutNumbers = get(horizontalCutNumbers);
	const $horizontalCutScale = get(horizontalCutScale);

	function getCutLineFunction(slope) {
		return (x) => slope * x - $cutTargetDepth;
	}

	function getSlope(cutNum) {
		const theta = $cutAngleScale(cutNum);

		return (
			($cutTargetDepth + $radius * Math.sin(theta)) /
			($radius * Math.cos(theta))
		);
	}

	// with radial cuts, pieceAreas is a 2D array whose major index corresponds to layer number
	// the minor index corresponds to piece number

	// first, count total number of pieces for each layer
	// TODO can we calculate areas within this first pass?
	const pieceAreas = $layerRadii.map((layerRadius) => {
		const pieces = [];

		$cutNumbers.forEach((cutNum) => {
			const m = getSlope(cutNum);
			const cutLineFunction = getCutLineFunction(m);
			const { discriminant, doesIntersect } = doesLineIntersectCircleAboveXAxis(
				{
					slope: m,
					yIntercept: -$cutTargetDepth,
					radius: layerRadius
				}
			);

			if (doesIntersect) {
				const x =
					($cutTargetDepth * m + Math.sqrt(discriminant)) / (m ** 2 + 1);

				if (x > 0 && cutLineFunction(x) > 0) {
					pieces.push({
						xOfLeftCutIntersection: x,
						leftCutLineSlope: m
					});
				}
			}
		});

		return { layerRadius, pieces };
	});

	// after each layer's pieces are counted,
	// calculate areas for each piece
	pieceAreas.forEach(({ pieces, layerRadius }, layerNum, layers) => {
		const isFirstLayer = layerNum === 0;
		const previousLayer = layers[layerNum - 1];

		pieces.forEach((piece, pieceNum, pieces) => {
			const isFirstPiece = pieceNum === 0;
			const isLastPiece = pieceNum === pieces.length - 1;
			const { leftCutLineSlope, xOfLeftCutIntersection } = piece;
			const xRange = [undefined, undefined];
			const yRange = [undefined, undefined];
			const nextPiece = pieces[pieceNum + 1];

			function getXLowerBound(_pieceNum) {
				const xWhereLeftCutIntersectsPreviousLayer =
					previousLayer?.pieces[_pieceNum]?.xOfLeftCutIntersection;
				const xWhereLeftCutIntersectsCuttingBoard =
					$cutTargetDepth / pieces[_pieceNum]?.leftCutLineSlope;

				return (
					xWhereLeftCutIntersectsPreviousLayer ??
					xWhereLeftCutIntersectsCuttingBoard
				);
			}

			// find piece's x range
			xRange[0] = xOfLeftCutIntersection;
			xRange[1] = isLastPiece ? layerRadius : nextPiece.xOfLeftCutIntersection;

			if (!isFirstPiece) {
				xRange[0] = getXLowerBound(pieceNum);
			}

			piece.xRange = xRange;

			// find piece's y-range
			yRange[0] =
				isLastPiece || isFirstLayer
					? 0
					: Math.sqrt(
							previousLayer.layerRadius ** 2 -
								previousLayer.pieces[pieceNum + 1]?.xOfLeftCutIntersection ** 2
					  ) || 0;
			yRange[1] = Math.sqrt(layerRadius ** 2 - xOfLeftCutIntersection ** 2);

			piece.yRange = yRange;

			// calculate piece's area by adding/subtracting integrals
			let area = getVerticalCutArea(
				layerRadius,
				xOfLeftCutIntersection,
				xRange[1]
			);

			// add left cut's integral
			if (!isFirstPiece) {
				area += getAreaUnderLine({
					slope: leftCutLineSlope,
					yIntercept: -$cutTargetDepth,
					x1: xRange[0],
					x2: xOfLeftCutIntersection
				});
			}

			// subtract right cut's integral
			if (!isLastPiece) {
				const xOfRightCutIntersectionWithPreviousLayer = getXLowerBound(
					pieceNum + 1
				);

				area -= getAreaUnderLine({
					slope: nextPiece.leftCutLineSlope,
					yIntercept: -$cutTargetDepth,
					x1: xOfRightCutIntersectionWithPreviousLayer,
					x2: xRange[1]
				});
			}

			// subtract previous layer's vertical cut
			const xOfLeftCutIntersectionWithPreviousLayer =
				previousLayer?.pieces[pieceNum]?.xRange[1];
			const hasPieceBelowInSlice =
				!isFirstLayer && xOfLeftCutIntersectionWithPreviousLayer > xRange[0];

			if (hasPieceBelowInSlice) {
				area -= getVerticalCutArea(
					previousLayer.layerRadius,
					previousLayer.pieces[pieceNum]?.xOfLeftCutIntersection,
					xOfLeftCutIntersectionWithPreviousLayer
				);
			}

			piece.area = area;

			// horizontal cuts that intersect this piece will create subpieces
			let subPieces = [];

			$horizontalCutNumbers.forEach((horizontalCutNum) => {
				const cutY = $horizontalCutScale(horizontalCutNum) * $radius;

				if (isInRange(cutY, yRange[0], yRange[1])) {
					// TODO this addition/subtraction of areas is identical to `area`'s derivation
					//   is there a way to reuse a function for this?
					let upperPieceArea = getVerticalCutAreaAboveHorizontalLine({
						layerRadius,
						cutY,
						cutX: xOfLeftCutIntersection,
						nextCutX: xRange[1]
					});

					// add left cut's integral
					if (!isFirstPiece) {
						const x1 = Math.max(
							(cutY + $cutTargetDepth) / leftCutLineSlope,
							xRange[0]
						);

						// also need to subtract area of rectangle below cutY
						upperPieceArea +=
							getAreaUnderLine({
								slope: leftCutLineSlope,
								yIntercept: -$cutTargetDepth,
								x1,
								x2: xOfLeftCutIntersection
							}) -
							(xOfLeftCutIntersection - x1) * cutY;
					}

					// subtract previous layer's vertical cut
					const hasPieceBelowInSlice =
						!isFirstLayer &&
						cutY < Math.sqrt(previousLayer.layerRadius ** 2 - xRange[0] ** 2);

					if (hasPieceBelowInSlice) {
						const xOfHorizontalCutIntersectionWithPreviousLayer = Math.sqrt(
							previousLayer.layerRadius ** 2 - cutY ** 2
						);

						upperPieceArea -= getVerticalCutAreaAboveHorizontalLine({
							layerRadius: previousLayer.layerRadius,
							cutY,
							cutX: xRange[0],
							nextCutX: xOfHorizontalCutIntersectionWithPreviousLayer
						});
					}

					// subtract right cut's integral
					if (
						!isLastPiece &&
						cutY < Math.sqrt(layerRadius ** 2 - xRange[1] ** 2)
					) {
						const x1 = (cutY + $cutTargetDepth) / nextPiece.leftCutLineSlope;

						// also need to subtract area of rectangle below cutY
						upperPieceArea -=
							getAreaUnderLine({
								slope: nextPiece.leftCutLineSlope,
								yIntercept: -$cutTargetDepth,
								x1,
								x2: xRange[1]
							}) -
							(xRange[1] - x1) * cutY;
					}

					if (subPieces.length) {
						// in this block, upperPieceArea is actually the top 2/3 pieces' area
						const topPieceArea = subPieces[0];

						subPieces = [
							topPieceArea,
							upperPieceArea - topPieceArea,
							area - upperPieceArea
						];
					} else {
						// add a top piece and a bottom piece
						subPieces = [upperPieceArea, area - upperPieceArea];
					}
				}
			});

			piece.subPieces = subPieces;
		});
	});

	return pieceAreas;
}

// radialAreas is returned by getRadialCutAreas
export function flattenRadialAreas(radialAreas) {
	return radialAreas
		.map(({ pieces }) =>
			pieces.map(({ area, subPieces }) => (subPieces.length ? subPieces : area))
		)
		.flat(2);
}
