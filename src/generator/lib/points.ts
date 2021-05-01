/**
 * Convert the base64 encoded float32 array to actually float32 values
 * @param buffer base64 encoded string
 */
export function convertBase64Floats(buffer: string) {
	// Decode base64
	const decodedBuffer = new Buffer(buffer, 'base64');
	// Float32 => 4 bytes
	// Get number of float values
	const floatValuesCount = decodedBuffer.length / 4;
	// New array with correct floats
	const arrayOfFloats: number[] = [];
	// Get float32s from buffer
	for (let i = 0; i < floatValuesCount; i++) {
		const offset = i * 4;
		const float = decodedBuffer.readFloatLE(offset);
		arrayOfFloats.push(float);
	}
	// Return new array of correct float values
	return arrayOfFloats;
}

export function convertInt32Array(buffer: Buffer, useBE: boolean = false) {
	const intValuesCount = buffer.length / 4;
	const arrayOfInts: number[] = [];
	for (let i = 0; i < intValuesCount; i++) {
		const offset = i * 4;
		const float = useBE ? buffer.readInt32BE(offset) : buffer.readInt32LE(offset);
		arrayOfInts.push(float);
	}
	return arrayOfInts;
}

/**
 * Convert the base64 encoded int32 array to actually int32 values
 * @param buffer base64 encoded string
 * @param useBE use readInt32BE instead of readInt32LE
 */
export function convertBase64Integers(buffer: string, useBE: boolean = false) {
	// Decode base64
	const decodedBuffer = new Buffer(buffer, 'base64');
	// Int32 => 4 bytes
	// Get number of integer values
	const intValuesCount = decodedBuffer.length / 4;
	// New array with correct floats
	const arrayOfInts: number[] = [];
	// Get float32s from buffer
	for (let i = 0; i < intValuesCount; i++) {
		const offset = i * 4;
		const float = useBE ? decodedBuffer.readInt32BE(offset) : decodedBuffer.readInt32LE(offset);
		arrayOfInts.push(float);
	}
	// Return new array of correct float values
	return arrayOfInts;
}

/**
 * Convert the
 * @param floatArray Array with float32 values
 */
export function floatPairs(floatArray: number[]) {
	// New array with float32 pairs
	const pairArray: Array<Array<number>> = [];
	// Add float32 pairs to the new array
	for (let i = 0; i < floatArray.length; i += 2) {
		// Push new pair of two float32 values
		pairArray.push([floatArray[i], floatArray[i + 1]]);
	}
	return pairArray;
}

/**
 * Split the points array into chunks with a variable chunk size
 * @param arr Array to chunk
 * @param chunks Chunk sizes
 */
export function splitArrayInChunks<T>(arr: T[], chunks: number[]): Array<T[]> {
	let startIndex = 0;
	const chunkArray: Array<T[]> = [];
	for (const chunk of chunks) {
		const endIndex = startIndex + chunk;
		chunkArray.push(arr.slice(startIndex, endIndex));
		startIndex = endIndex;
	}
	return chunkArray;
}

/**
 * Chunk an array in a specific size
 * @param arr
 * @param size
 */
export function chunk<T>(arr: T[], size: number = 1) {
	const chunkArray: Array<T[]> = [];
	for (let i = 0; i < arr.length; i += size) {
		chunkArray.push(arr.slice(i,i + size));
	}
	return chunkArray;
}

export function parseStringFloatArray(stringArray: string) {
	return stringArray
		.replace(/^{|}$/gm, '')
		.split(',')
		.map(v => v.trim())
		.map(v => parseFloat(v));
}
