import {NotabilityDrawInstruction} from "./INotabilitySession";
import type { CGPath } from './IShapes';

export interface IPoint {
	x: number;
	y: number;
}

export interface Color {
	r: number;
	g: number;
	b: number;
	a: number;
}

export interface CoordinateData extends NotabilityDrawInstruction { // Later for color and width info
	points: IPoint[];
	color: Color;
	zIndex: number;
	width: number;
	cgPath?: CGPath;
	fractionalWidthMultipliers?: number[];
}
