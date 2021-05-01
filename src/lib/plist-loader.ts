import plist from 'simple-plist';
import {
	ImageMediaObject,
	InkedSpatialHash,
	INotabilityBaseClass,
	INotabilityClassTypes,
	INotabilityReference,
	INotabilitySessionRoot,
	NotabilityClassTypes,
	NotabilityDrawInstructionType,
	NotabilitySessionObjectType,
	NoteTakingSession,
	PaperLineStyle,
} from './INotabilitySession';
import {
	chunk,
	convertBase64Floats,
	convertBase64Integers,
	floatPairs,
	parseStringFloatArray,
	splitArrayInChunks
} from "./points";
import {Color, CoordinateData, IPoint} from "./IPoints";
import {NotabilityMedia} from "./IMedia";
import {
	CGPathInstruction,
	CGPathInstructionType,
	NotabilityBasicShape,
	NotabilityShapeCircle,
	NotabilityShapes,
	NotabilityShapeType
} from "./IShapes";
import {writeFileSync} from "fs";
import {join} from 'path';
import {SerializationType, ShapeBufferReader} from "./shape-buffer-reader";
import {createBezierKitPath} from "./bezier-kit-path";

export class NotabilitySession {
	/**
	 * Get a NotabilitySession from the plist data
	 * @param data plist or bplist as string or buffer
	 */
	static getNotabilitySession(data: string | Buffer): NotabilitySession {
		const parsedData = plist.parse(data) as INotabilitySessionRoot;

		const $objects = parsedData?.$objects ?? [];

		return new NotabilitySession($objects);
	}

	private classTypeMap: {
		[key: number]: { name: string; index: number };
	} = {};

	constructor(
		private readonly referenceObjects: NotabilitySessionObjectType[]
	) {
		this.generateTypeReferenceTree();
	}

	public getDrawInstructions() {
		return [
			...this.getShapes(),
			...this.getMediaObjects(),
			...this.getCoordinates()
		].sort((a, b) => a.zIndex - b.zIndex);
	}

	public getPaperLineStyle() {
		const session = this.getClassForType<NoteTakingSession>("NoteTakingSession");
		return this.safeReferenceAccess<PaperLineStyle>(session?.paperLineStyle);
	}

	public getColorData() {
		const data = this.getClassForType<InkedSpatialHash>("InkedSpatialHash");
		const colorEncodedData = this.safeReferenceAccess(data?.curvescolors);
		return new Int32Array(colorEncodedData);
	}

	private convertShapeColor(colorObjc: { rgba: [number,number,number,number] }) {
		return {
			r: colorObjc?.rgba?.[0] * 100 ?? 0,
			g: colorObjc?.rgba?.[1] * 100 ?? 0,
			b: colorObjc?.rgba?.[2] * 100 ?? 0,
			a: colorObjc?.rgba?.[3] ?? 1,
		} as Color;
	}

	private convertShapePointArray(pointArray: number[]) {
		return {
			x: pointArray[0],
			y: pointArray[1]
		} as IPoint;
	}

	private positiv(input: number) {
		return input < 0 ? input * -1 : input;
	}

	public getShapes() {
		const newShapeData: NotabilityShapes[] = [];
		const data = this.getClassForType<InkedSpatialHash>("InkedSpatialHash");
		const shapesEncodedData = this.safeReferenceAccess(data?.shapes);
		const decoded = Buffer.from(shapesEncodedData, 'base64');
		writeFileSync(join(__dirname, '../../InkedSpatialHash.plist'), decoded);
		const shapeRawData = plist.parse(decoded);
		const xml = plist.stringify(shapeRawData);
		const shapeData = shapeRawData?.shapes ?? [];
		const shapeTypes = shapeRawData?.kinds ?? [];
		const zIndexes = shapeRawData?.indices ?? [];
		for (let i = 0; i < shapeData.length; i++) {
			const kind = shapeTypes[i];
			const zIndex = zIndexes[i];
			const shape = shapeData[i];
			let basic: NotabilityBasicShape = {
				'@NType': NotabilityDrawInstructionType.SHAPE,
				type: kind as NotabilityShapeType,
				zIndex,
				style: {}
			};
			if (shape?.appearance?.style) basic.style!.style = shape?.appearance?.style;
			if (shape?.appearance?.strokeColor) basic.style!.strokeColor = this.convertShapeColor(shape?.appearance?.strokeColor);
			if (shape?.appearance?.fillColor) basic.style!.fillColor = this.convertShapeColor(shape?.appearance?.fillColor);
			if (shape?.appearance?.strokeWidth) basic.style!.strokeWidth = shape?.appearance?.strokeWidth;
			debugger;
			switch (kind) {
				case 'line':
					newShapeData.push({
						...basic,
						type: NotabilityShapeType.LINE,
						start: this.convertShapePointArray(shape?.startPt),
						end: this.convertShapePointArray(shape?.endPt),
					})
					break;
				case 'triangle':
					newShapeData.push({
						...basic,
						type: NotabilityShapeType.TRIANGLE,
						points: shape?.points?.map(v => this.convertShapePointArray(v)) as [IPoint, IPoint, IPoint],
						isClosed: shape?.isClosed ?? false,
					})
					break;
				case 'rectangle':
				case 'square':
					debugger;
					newShapeData.push({
						...basic,
						type: NotabilityShapeType.RECTANGLE,
						points: shape?.points?.map(v => this.convertShapePointArray(v)) as [IPoint, IPoint, IPoint, IPoint],
						isClosed: shape?.isClosed ?? false,
					})
					break;
				case 'circle':
					const corners = shape?.rotatedRect?.corners ?? [];
					// Calculate center pos
					const [firstX, firstY] = corners?.[0];
					const data = {
						...basic,
						type: NotabilityShapeType.CIRCLE,
					} as NotabilityShapeCircle;
					for (const otherCoordinate of corners) {
						const [otherX, otherY] = otherCoordinate;
						if (firstX !== otherX && firstY !== otherY) {
							const orderedArray: IPoint[] = [{ x: firstX, y: firstY }, { x: otherX, y: otherY }]
								.sort((a, b) => a.x > b.y && a.y > b.y ? 1 : -1);
							const startPoint = orderedArray[0];
							const endPoint = orderedArray[1];
							const centerPoint: IPoint = {
								x: startPoint.x + ((endPoint.x - startPoint.x) / 2),
								y: startPoint.y + ((endPoint.y - startPoint.y) / 2),
							};
							data.center = centerPoint;
							data.debugPoints = [...corners.map(v => ({x: v[0], y: v[1]})), centerPoint];
						}
						if (otherX === firstX && otherY !== firstY) {
							let d = otherY - firstY;
							if (d < 0) d = d * -1;
							data.radius = d / 2;
						}
					}
					newShapeData.push(data);
					break;
				case 'ellipse':
					/**
					 * 1****2
					 * *	*
					 * *	*
					 * *	*
					 * 4****3
					 */
					const corners4times: IPoint[] = (shape?.rotatedRect?.corners ?? []).map(v => ({ x: v[0], y: v[1] }));
					const firstPoint = corners4times.sort((a, b) => {
						if (a.y < b.y) {
							return -1;
						} else if (b.y < a.y) {
							return 1;
						} else {
							if (a.x < b.x) {
								return -1;
							} else if (b.x < a.x) {
								return 1;
							} else {
								return 0
							}
						}
					})[0];
					const thirdPoint = corners4times.sort((a, b) => {
						if (a.y > b.y) {
							return -1;
						} else if (b.y > a.y) {
							return 1;
						} else {
							if (a.x > b.x) {
								return -1;
							} else if (b.x > a.x) {
								return 1;
							} else {
								return 0
							}
						}
					})[0];
					const lastPoint = corners4times.sort((a, b) => {
						if (a.x < b.x) {
							return -1;
						} else if (b.x < a.x) {
							return 1;
						} else {
							if (a.y > b.y) {
								return -1;
							} else if (b.y > a.y) {
								return 1;
							} else {
								return 0
							}
						}
					})[0];
					const secondPoint = corners4times.sort((a, b) => {
						if (a.x > b.x) {
							return -1;
						} else if (b.x > a.x) {
							return 1;
						} else {
							if (a.y < b.y) {
								return -1;
							} else if (b.y < a.y) {
								return 1;
							} else {
								return 0
							}
						}
					})[0];
					const centerX = firstPoint.x + ((thirdPoint.x - firstPoint.x) / 2);
					const centerY = firstPoint.y + ((thirdPoint.y - firstPoint.y) / 2);
					const center: IPoint = { x: centerX, y: centerY };
					const radiusX = (Math.sqrt(Math.pow(firstPoint.x - secondPoint.x, 2) + Math.pow(firstPoint.y - secondPoint.y, 2))) / 2;
					const radiusY = (Math.sqrt(Math.pow(firstPoint.x - lastPoint.x, 2) + Math.pow(firstPoint.y - lastPoint.y, 2))) / 2;
					const center1and2 = {
						x: firstPoint.x + ((secondPoint.x - firstPoint.x) / 2),
						y: firstPoint.y + ((secondPoint.y - firstPoint.y) / 2),
					}
					const vectorCenter1 = [1, firstPoint.y - center.y];
					const vectorCenter2 = [center1and2.x - center.x, center1and2.y - center.y];
					const angel = Math.acos(
						(
							(vectorCenter1[0]*vectorCenter2[0]) + (vectorCenter1[1]*vectorCenter2[1])
						)
						/
						(
							(Math.sqrt(Math.pow(vectorCenter1[0], 2) + Math.pow(vectorCenter1[1], 2)))
							*
							(Math.sqrt(Math.pow(vectorCenter2[0], 2) + Math.pow(vectorCenter2[1], 2)))
						)
					);

					newShapeData.push({
						...basic,
						type: NotabilityShapeType.ELLIPSE,
						center,
						radiusX,
						radiusY,
						rotation: angel,
						debugPoints: [...corners4times, center],
					});
					break;
				case 'partialshape':
					const debugPoints = [
						...shape?.extremePoints?.points?.map(v => ({ x: v[0], y: v[1] })),
					];
					const corners2 = [
						...shape?.rotatedRect?.corners?.map(v => ({ x: v[0], y: v[1] })),
					];
					const rect = [
						...shape?.rect?.map(v => ({ x: v[0], y: v[1] })),
					];

					const strokePath = createBezierKitPath(shape.strokePath);

					const outlinePath = createBezierKitPath(shape.outlinePath);

					newShapeData.push({
						...basic,
						type: NotabilityShapeType.PARTIALSHAPE,
						debugPoints,
						corners: corners2,
						rect,
						strokePath,
						outlinePath
					})

					// debugger;
					break;
				default:
					debugger;
					break;
			}
		}
		return newShapeData;
	}

	public getMediaObjects() {
		const mediaObjects: NotabilityMedia[] = [];
		const mediaObjectsRaw = this.getClassesForType<ImageMediaObject>('ImageMediaObject');
		for (const rawMediaObject of mediaObjectsRaw) {
			const figure = this.safeReferenceAccess<any>(rawMediaObject.figure);
			const FigureBackgroundObjectKey = this.safeReferenceAccess(figure.FigureBackgroundObjectKey);
			const kImageObjectSnapshotKey = this.safeReferenceAccess(FigureBackgroundObjectKey.kImageObjectSnapshotKey);
			const relativePath = this.safeReferenceAccess<string>(kImageObjectSnapshotKey.relativePath);
			const [originX, originY] = parseStringFloatArray(this.safeReferenceAccess(rawMediaObject.documentContentOrigin));
			const [scaleX, scaleY] = parseStringFloatArray(this.safeReferenceAccess(rawMediaObject.unscaledContentSize));
			const endX = originX + scaleX;
			const endY = originY + scaleY;
			const width = endX - originX;
			const height = endY - originY;
			const zIndex = this.safeReferenceAccess<number>(rawMediaObject.zIndex);
			mediaObjects.push({
				'@NType': NotabilityDrawInstructionType.MEDIA,
				path: relativePath,
				dimension: { width, height },
				origin: { x: originX, y: originY },
				end: { x: endX, y: endY },
				zIndex
			});
		}
		return mediaObjects;
	}

	public getCoordinates() {
		const data = this.getClassForType<InkedSpatialHash>("InkedSpatialHash");
		const pointsEncodedData = this.safeReferenceAccess(data?.curvespoints);
		const chunkEncodedData = this.safeReferenceAccess(data?.curvesnumpoints);
		const chunkSizes = convertBase64Integers(chunkEncodedData);
		const rawCoordinates = convertBase64Floats(pointsEncodedData);
		const coordinatesPair = floatPairs(rawCoordinates);
		const curvesArray = splitArrayInChunks(coordinatesPair, chunkSizes);
		const coordinateDataArray: CoordinateData[] = [];
		const colorRawData = this.getColorData();
		const colorChunks = chunk(Array.from(colorRawData), 4) as unknown as Array<number[]>;
		const bezierObject = this.safeReferenceAccess(data.bezierPathsDataDictionary)
		for (const ref of bezierObject["NS.objects"]) {
			const buf = this.safeReferenceAccess(ref);
			const bPath = createBezierKitPath(buf);
			debugger;
		}

		for (let i = 0; i < curvesArray.length; i++) {
			const curve = curvesArray[i];
			const colorDataArray = colorChunks[i];
			debugger;
			coordinateDataArray.push({
				'@NType': NotabilityDrawInstructionType.CURVE,
				points: curve.map(arr => ({ x: arr[0], y: arr[1] })),
				zIndex: i + 1,
				color: {
					r: colorDataArray[0],
					g: colorDataArray[1],
					b: colorDataArray[2],
					a: colorDataArray[3] / 255
				}
			});
		}
		return coordinateDataArray;
	}

	private getClassForType<T = INotabilityClassTypes>(type: NotabilityClassTypes) {
		const cls = this.getClassesForType(type);
		if (cls.length < 1) throw new Error('Can not find notability class type: ' + type);
		return cls?.[0] as unknown as T;
	}

	public getClassesForType<T = INotabilityClassTypes>(type: NotabilityClassTypes) {
		const results: T[] = [];
		for (const object of this.referenceObjects) {
			if (typeof object !== 'object') continue;
			if (!('$class' in object)) continue;
			const resolveObject = this.resolveObjectClassType<T>(object);
			// @ts-ignore
			if (resolveObject.$class !== type) continue;
			results.push(resolveObject);
		}
		return results;
	}

	private resolveObjectClassType<T = INotabilityClassTypes>(obj: INotabilityBaseClass): T {
		const uid = obj.$class.UID;
		return {
			...obj,
			$class: this.classTypeMap[uid].name,
		} as unknown as T;
	}

	public safeReferenceAccess<T>(reference: INotabilityReference | T): T {
		if (typeof reference !== 'object') return reference;
		if ("UID" in reference) {
			const result = this.referenceObjects[reference.UID] ;
			if (typeof result === 'object' && '$class' in result && typeof result.$class !== 'string') {
				return this.resolveObjectClassType<T>(result);
			} else {
				return result as unknown as T;
			}
		} else {
			return reference;
		}
	}

	private generateTypeReferenceTree() {
		for (let i = this.referenceObjects.length; i !== 0; i--) {
            const object = this.referenceObjects[i];
            if (typeof object === 'object') {
            	if ("$classname" in object && object?.$classname) {
            		this.classTypeMap[i] = {
            			name: object?.$classname,
						index: i
					};
				}
			}
        }
	}
}
