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

export interface CoordinateData { // Later for color and width info
	points: IPoint[];
	color: Color;
}
