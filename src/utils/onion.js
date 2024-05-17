import { deviation, format, mean, scaleLinear } from "d3";
import {
	doesLineIntersectCircleAboveXAxis,
	flattenRadialAreas,
	flattenVerticalAreas,
	formatPercentage,
	getAreaUnderLine,
	getVerticalCutArea,
	getVerticalCutAreaAboveHorizontalLine,
	isInRange
} from "./math.js";

export default class Onion {
	constructor({
		radius,
		numLayers,
		numCuts,
		cutType,
		cutTargetDepthPercentage,
		numHorizontalCuts
	}) {
		this.radius = radius;
		this.numLayers = numLayers;
		this.numCuts = numCuts;
		this.cutType = cutType;
		this.cutTargetDepthPercentage = cutTargetDepthPercentage;
		this.numHorizontalCuts = numHorizontalCuts;
	}

	get rScale() {
		return scaleLinear().domain([0, this.numLayers]).range([0, this.radius]);
	}

	get layerRadii() {
		return Array.from({ length: this.numLayers }).map((_, i) =>
			this.rScale(i + 1)
		);
	}

	get layerThickness() {
		return this.rScale(1);
	}

	get layerArcs() {
		return this.layerRadii.map(
			(layerRadius) => (x) => Math.sqrt(layerRadius ** 2 - x ** 2)
		);
	}

	get cutNumbers() {
		return Array.from({ length: this.numCuts }).map((_, i) => i);
	}

	get cutWidthScale() {
		return scaleLinear().domain([0, this.numCuts]).range([0, this.radius]);
	}

	get cutThickness() {
		return this.cutWidthScale(1);
	}

	get cutAngleScale() {
		return scaleLinear()
			.domain([0, this.numCuts])
			.range([Math.PI / 2, 0]);
	}

	get cutTargetDepth() {
		return this.radius * this.cutTargetDepthPercentage;
	}

	get horizontalCutNumbers() {
		return Array.from({ length: this.numHorizontalCuts })
			.map((_, i) => i)
			.reverse();
	}

	get horizontalCutScale() {
		return scaleLinear()
			.domain([0, this.numHorizontalCuts])
			.range([1 / (this.numHorizontalCuts + 1), 1]);
	}

	get storageKey() {
		return [
			`${this.numLayers}l`,
			`${this.numCuts}c`,
			this.cutType === "radial" ? "r" : "v",
			...(this.cutType === "radial"
				? [`${formatPercentage(this.cutTargetDepthPercentage)}d`]
				: []),
			`${this.numHorizontalCuts}h`
		].join(":");
	}

	get verticalAreas() {
		const $cutNumbers = this.cutNumbers;
		const $cutWidthScale = this.cutWidthScale;
		const $radius = this.radius;
		const $layerRadii = this.layerRadii;
		const $horizontalCutNumbers = this.horizontalCutNumbers;
		const $horizontalCutScale = this.horizontalCutScale;

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
					const verticalCutArea = getVerticalCutArea(
						layerRadius,
						cutX,
						nextCutX
					);
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

	get radialAreas() {
		const $layerRadii = this.layerRadii;
		const $cutAngleScale = this.cutAngleScale;
		const $radius = this.radius;
		const $cutNumbers = this.cutNumbers;
		const $cutTargetDepth = this.cutTargetDepth;
		const $horizontalCutNumbers = this.horizontalCutNumbers;
		const $horizontalCutScale = this.horizontalCutScale;

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
				const { discriminant, doesIntersect } =
					doesLineIntersectCircleAboveXAxis({
						slope: m,
						yIntercept: -$cutTargetDepth,
						radius: layerRadius
					});

				if (doesIntersect) {
					const x =
						($cutTargetDepth * m + Math.sqrt(discriminant)) / (m ** 2 + 1);

					if (x > 0 && cutLineFunction(x) > 0) {
						pieces.push({
							xOfLeftCutIntersection: x,
							leftCutLineSlope: m,
							cutNum
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
				xRange[1] = isLastPiece
					? layerRadius
					: nextPiece.xOfLeftCutIntersection;

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
									previousLayer.pieces[pieceNum + 1]?.xOfLeftCutIntersection **
										2
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

	// relative standard deviation = standard deviation expressed as a percentage of the mean
	get standardDeviation() {
		const allAreas =
			this.cutType === "vertical"
				? flattenVerticalAreas(this.verticalAreas)
				: flattenRadialAreas(this.radialAreas);
		const standardDeviation = deviation(allAreas);
		const meanArea = mean(allAreas);

		return +format(".1f")((standardDeviation / meanArea) * 100);
	}
}
