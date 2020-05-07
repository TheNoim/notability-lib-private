import plist from 'simple-plist';
import {
	InkedSpatialHash,
	INotabilityBaseClass, INotabilityClassTypes, INotabilityReference,
	INotabilitySessionRoot, NotabilityClassTypes,
	NotabilitySessionObjectType, NoteTakingSession, PaperLineStyle,
} from './INotabilitySession';
import {
	chunk,
	convertBase64Floats,
	convertBase64Integers,
	convertInt32Array,
	floatPairs,
	splitArrayInChunks
} from "./points";
import {CoordinateData} from "./IPoints";

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

	public getPaperLineStyle() {
		const session = this.getClassForType<NoteTakingSession>("NoteTakingSession");
		return this.safeReferenceAccess<PaperLineStyle>(session?.paperLineStyle);
	}

	public getColorData() {
		const data = this.getClassForType<InkedSpatialHash>("InkedSpatialHash");
		const colorEncodedData = this.safeReferenceAccess(data?.curvescolors);
		return new Int32Array(colorEncodedData);
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
		for (let i = 0; i < curvesArray.length; i++) {
			const curve = curvesArray[i];
			const colorDataArray = colorChunks[i];
			coordinateDataArray.push({
				points: curve.map(arr => ({ x: arr[0], y: arr[1] })),
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
