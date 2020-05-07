export interface INotabilitySessionRoot {
	$version: number;
	$archiver: string;
	$top: any;
	$objects: NotabilitySessionObjectType[];
}

export interface INotabilityClassDescription {
	$classname: string;
	$classes?: string[];
}

export interface INotabilityBaseClass {
	$class: INotabilityReference;
}

export interface INotabilityClass {
	$class: string;
}

export interface INotabilityReference {
	UID: number;
}

export interface InkedSpatialHash extends INotabilityClass {
	$class: 'InkedSpatialHash';
	curvescolors: INotabilityReference | Buffer;
	curvesfractionalwidths: INotabilityReference | string;
	curvesnumpoints: INotabilityReference | string; // base64 encoded int32 array
	curvespoints: INotabilityReference | string; // base64 encoded float32 array
	curvesstyles: INotabilityReference | string;
	curveswidth: INotabilityReference | string;
}

export interface ImageMediaObject extends INotabilityClass {
	unscaledContentSize: INotabilityReference | string;
	documentOrigin: INotabilityReference | string;
	documentContentOrigin: INotabilityReference | string;
}

export interface NSTime extends INotabilityClass {
	$class: 'NSDate';
	'NS.time': number;
}

export interface NoteTakingSession extends INotabilityClass {
	NBNoteTakingSessionBundleVersionNumberKey: INotabilityReference | string;
	NBNoteTakingSessionHandwritingLanguageKey: INotabilityReference | string;
	NBNoteTakingSessionIsHighlighterBehindTextKey: INotabilityReference | boolean;
	NBNoteTakingSessionMinorVersionNumberKey: INotabilityReference | number;
	NBPaperMajorVersionNumber: INotabilityReference | number;
	NBPaperMinorVersionNumber: INotabilityReference | number;
	creationDate: INotabilityReference | NSTime;
	isReadOnly: INotabilityReference | boolean;
	name: INotabilityReference | string;
	packagePath: INotabilityReference | string;
	paperIndex: INotabilityReference | number;
	paperLineStyle: INotabilityReference | PaperLineStyle;
	sessionFormatVersion: INotabilityReference | number;
	subject: INotabilityReference | string;
	tags: INotabilityReference | string;
}

export type PaperLineStyle = number;

export type NotabilityPointsArray = number[];
export type NotabilityNumPointsArray = number[];

export type INotabilityClassTypes = INotabilityClass | InkedSpatialHash;

export type NotabilitySessionObjectType =
	| string
	| '$null'
	| INotabilityBaseClass
	| INotabilityClassDescription;

export type NotabilityClassTypes = string | 'InkedSpatialHash' | 'NoteTakingSession' | 'ImageMediaObject';
