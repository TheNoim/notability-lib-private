declare module 'simple-plist' {
	import { WriteFileOptions } from 'fs';

	export type Callback = (error?: any, result?: any) => any;

	export interface SimplePlist {
		parse(input: string | Buffer, aFile?: string): any;
		readFileSync(path: string): any;
		readFile(path: string, callback: Callback): void;
		writeFileSync(
			path: string,
			objc: any,
			options?: WriteFileOptions
		): void;
		writeFile(
			path: string,
			objc: any,
			options: WriteFileOptions | null | undefined,
			callback: Callback
		): void;
		writeBinaryFileSync(
			path: string,
			objc: any,
			options?: WriteFileOptions
		): void;
		writeBinaryFile(
			path: string,
			objc: any,
			options: WriteFileOptions | null | undefined,
			callback: Callback
		): void;
		stringify(objc: any): string;
	}

	const parser: SimplePlist;

	export default parser;
}
