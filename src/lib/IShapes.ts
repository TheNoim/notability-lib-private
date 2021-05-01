import {Color, IPoint} from "./IPoints";
import {NotabilityDrawInstruction} from "./INotabilitySession";

export enum NotabilityShapeType {
    LINE = 'line',
    RECTANGLE = 'rectangle',
    CIRCLE = 'circle',
    TRIANGLE = 'triangle',
    ELLIPSE = 'ellipse',
    PARTIALSHAPE = 'partialshape'
}

export interface NotabilityShapeStyle {
    style?: number; // Unknown
    strokeColor?: Color;
    strokeWidth?: number;
    fillColor?: Color;
}

export interface NotabilityBasicShape extends NotabilityDrawInstruction {
    type: NotabilityShapeType;
    style?: NotabilityShapeStyle;
    zIndex: number;
}

export interface NotabilityShapeLine extends NotabilityBasicShape {
    type: NotabilityShapeType.LINE;
    end: IPoint;
    start: IPoint;
}

export interface NotabilityShapeRectangle extends NotabilityBasicShape {
    type: NotabilityShapeType.RECTANGLE;
    points: [IPoint, IPoint, IPoint, IPoint];
    isClosed: boolean;
}

export interface NotabilityShapeCircle extends NotabilityBasicShape {
    type: NotabilityShapeType.CIRCLE;
    center: IPoint;
    radius: number;
    debugPoints?: IPoint[];
}

export interface NotabilityShapeTriangle extends NotabilityBasicShape {
    type: NotabilityShapeType.TRIANGLE;
    points: [IPoint, IPoint, IPoint];
    isClosed: boolean;
}

export interface NotabilityShapeEllipse extends NotabilityBasicShape {
    type: NotabilityShapeType.ELLIPSE;
    center: IPoint;
    radiusX: number;
    radiusY: number;
    rotation: number; // in radian
    debugPoints?: IPoint[];
}

export interface NotabilityShapePartialshape extends NotabilityBasicShape {
    type: NotabilityShapeType.PARTIALSHAPE;
    debugPoints?: IPoint[];
    corners?: IPoint[];
    rect?: IPoint[];
    strokePath?: CGPath;
    outlinePath?: CGPath;
}

export enum CGPathInstructionType {
    MOVE_TO,
    ADD_LINE,
    ADD_QUAD_CURVE,
    ADD_CURVE
}

export interface CGPath {
    instructions: CGPathInstruction[];
}

export type CGPathInstruction = CGPathInstructionMoveTo | CGPathInstructionAddLine | CGPathInstructionAddQuadCurve | CGPathInstructionAddCurve;

export interface CGPathInstructionBase {
    type: CGPathInstructionType;
    to: IPoint;
}

export interface CGPathInstructionMoveTo extends CGPathInstructionBase {
    type: CGPathInstructionType.MOVE_TO;
    to: IPoint;
}

export interface CGPathInstructionAddLine extends CGPathInstructionBase {
    type: CGPathInstructionType.ADD_LINE;
    to: IPoint;
}

export interface CGPathInstructionAddQuadCurve extends CGPathInstructionBase {
    type: CGPathInstructionType.ADD_QUAD_CURVE;
    to: IPoint;
    control: IPoint;
}

export interface CGPathInstructionAddCurve extends CGPathInstructionBase {
    type: CGPathInstructionType.ADD_CURVE;
    to: IPoint;
    control1: IPoint;
    control2: IPoint;
}

export type NotabilityShapes = NotabilityShapePartialshape | NotabilityShapeLine | NotabilityShapeCircle | NotabilityShapeEllipse | NotabilityShapeRectangle | NotabilityShapeTriangle;
