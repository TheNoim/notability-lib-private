import Paper from 'paper';
import type {DrawInstructionArray} from '../generator/lib/INotabilitySession';
import {NotabilityDrawInstructionType} from "../generator/lib/INotabilitySession";
import {Color, CoordinateData, IPoint} from "../generator/lib/IPoints";
import {
    CGPath,
    CGPathInstructionType,
    NotabilityBasicShape,
    NotabilityShapeCircle,
    NotabilityShapeEllipse,
    NotabilityShapeLine,
    NotabilityShapePartialshape,
    NotabilityShapeRectangle,
    NotabilityShapeTriangle,
    NotabilityShapeType
} from "../generator/lib/IShapes";
import {NotabilityMedia} from "../generator/lib/IMedia";

const canvas = document.querySelector('#notability-canvas') as HTMLCanvasElement;

Paper.setup(canvas);

canvas.addEventListener('wheel', event => {
    let newZoom = Paper.view.zoom;
    let oldZoom = Paper.view.zoom;

    if (event.deltaY > 0) {
        newZoom = Paper.view.zoom * 1.05;
    } else {
        newZoom = Paper.view.zoom * 0.95;
    }

    let beta = oldZoom / newZoom;

    let mousePosition = new Paper.Point(event.offsetX, event.offsetY);

    //viewToProject: gives the coordinates in the Project space from the Screen Coordinates
    let viewPosition = Paper.view.viewToProject(mousePosition);

    let mpos = viewPosition;
    let ctr = Paper.view.center;

    let pc = mpos.subtract(ctr);
    let offset = mpos.subtract(pc.multiply(beta)).subtract(ctr);

    Paper.view.zoom = newZoom;
    Paper.view.center = Paper.view.center.add(offset);

    event.preventDefault();
});

const tool = new Paper.Tool();

tool.onMouseDrag = function(event) {
    const pan_offset = event.point.subtract(event.downPoint);
    Paper.view.center = Paper.view.center.subtract(pan_offset);
}

const resp = await fetch('data.json');
const data: DrawInstructionArray = await resp.json();

console.log(data);

function createPointFromIPoint(point: IPoint) {
    return new Paper.Point(point.x, point.y);
}
function drawCGPath(cgPath: CGPath) {
    const path = new Paper.Path();
    for (const cgPathInstruction of cgPath.instructions) {
        switch (cgPathInstruction.type) {
            case CGPathInstructionType.MOVE_TO: {
                path.moveTo(createPointFromIPoint(cgPathInstruction.to))
                break;
            }
            case CGPathInstructionType.ADD_LINE: {
                path.add(createPointFromIPoint(cgPathInstruction.to));
                break;
            }
            case CGPathInstructionType.ADD_QUAD_CURVE: {
                const control = createPointFromIPoint(cgPathInstruction.control);
                const to = createPointFromIPoint(cgPathInstruction.to);
                path.quadraticCurveTo(control, to);
                break;
            }
            case CGPathInstructionType.ADD_CURVE: {
                const control1 = createPointFromIPoint(cgPathInstruction.control1)
                const control2 = createPointFromIPoint(cgPathInstruction.control2);
                const to = createPointFromIPoint(cgPathInstruction.to);
                path.cubicCurveTo(control1, control2, to);
                break;
            }
        }
    }
    return path;
}

function createPaperColor(color: Color) {
    return new Paper.Color(color.r / 255, color.g / 255, color.b / 255, color.a);
}

let count = 0;

let mediaCount = 0;

for (const instruction of data) {
    switch (instruction["@NType"]) {
        case NotabilityDrawInstructionType.CURVE: {
            const coordinateData = instruction as CoordinateData;
            if (coordinateData.cgPath) {
                const path = drawCGPath(coordinateData?.cgPath ?? { instructions: [] });
                // path.strokeColor = new Paper.Color(coordinateData.color);
                // path.strokeWidth = coordinateData.fractionalWidthMultipliers!.reduce((p, c) => p + c, 0) / coordinateData.fractionalWidthMultipliers!.length;
                path.fillColor = createPaperColor(coordinateData.color);
            } else {
                const path = new Paper.Path()
                let first = true;
                for (const point of coordinateData.points) {
                    if (first) {
                        first = false;
                        path.moveTo(createPointFromIPoint(point));
                    } else {
                        path.add(createPointFromIPoint(point));
                    }
                }
                path.strokeColor = createPaperColor(coordinateData.color);
            }
            break;
        }
        case NotabilityDrawInstructionType.MEDIA: {
            const media = instruction as NotabilityMedia;
            const imgTag = document.createElement('img');
            imgTag.id = `media-ele-${mediaCount}`;
            imgTag.src = media.path;
            imgTag.style.display = 'none';
            const raster = new Paper.Raster(imgTag);
            raster.position = new Paper.Point(media.origin.x + (media.dimension.width / 2), media.origin.y + (media.dimension.height / 2));
            // @ts-ignore
            raster.onLoad = () => {
                raster.scale(media.dimension.width / raster.width, media.dimension.height / raster.height);
            };
            mediaCount++;
            break;
        }
        case NotabilityDrawInstructionType.SHAPE: {
            const shape = instruction as NotabilityBasicShape;
            switch (shape.type) {
                case NotabilityShapeType.PARTIALSHAPE: {
                    const partialShape = shape as NotabilityShapePartialshape;
                    const path = drawCGPath(partialShape.strokePath!);
                    if (partialShape.style) {
                        if (partialShape.style.fillColor) {
                            path.fillColor = createPaperColor(partialShape.style.fillColor);
                        } else if (partialShape.style.strokeColor) {
                            path.fillColor = createPaperColor(partialShape.style.strokeColor);
                        } else {
                            path.fillColor = Paper.Color.random();
                        }
                    } else {
                        path.fillColor = Paper.Color.random();
                    }
                    break;
                }
                case NotabilityShapeType.LINE: {
                    const line = shape as NotabilityShapeLine;
                    const start = createPointFromIPoint(line.start);
                    const end = createPointFromIPoint(line.end);
                    const path = new Paper.Path();
                    path.moveTo(start);
                    path.add(end);
                    if (line.style?.strokeColor) {
                        path.strokeColor = createPaperColor(line.style.strokeColor);
                    }
                    if (line.style?.strokeWidth) {
                        path.strokeWidth = line.style.strokeWidth;
                    }
                    break;
                }
                case NotabilityShapeType.RECTANGLE: {
                    const rectangle = shape as NotabilityShapeRectangle;
                    const points = rectangle.points.map(v => createPointFromIPoint(v));
                    const path = new Paper.Path();
                    path.moveTo(points[0]);
                    path.add(points[1]);
                    path.add(points[2]);
                    path.add(points[3]);
                    path.add(points[0]);
                    if (rectangle.style?.strokeColor) {
                        path.strokeColor = createPaperColor(rectangle.style.strokeColor);
                    }
                    if (rectangle.style?.strokeWidth) {
                        path.strokeWidth = rectangle.style.strokeWidth;
                    }
                    if (rectangle.style?.fillColor) {
                        path.fillColor = createPaperColor(rectangle.style.fillColor);
                    }
                    break;
                }
                case NotabilityShapeType.CIRCLE: {
                    const circle = shape as NotabilityShapeCircle;
                    const center = createPointFromIPoint(circle.center);
                    const path = new Paper.Path.Circle(center, circle.radius);
                    if (circle.style?.strokeColor) {
                        path.strokeColor = createPaperColor(circle.style.strokeColor);
                    }
                    if (circle.style?.fillColor) {
                        path.fillColor = createPaperColor(circle.style.fillColor);
                    }
                    if (circle.style?.strokeWidth) {
                        path.strokeWidth = circle.style.strokeWidth;
                    }
                    break;
                }
                case NotabilityShapeType.ELLIPSE: {
                    const ellipse = shape as NotabilityShapeEllipse;
                    const origin = new Paper.Point(ellipse.center.x - ellipse.radiusX, ellipse.center.y - ellipse.radiusY);
                    const rectangle = new Paper.Rectangle(origin, new Paper.Size(ellipse.radiusX * 2, ellipse.radiusY * 2));
                    const path = new Paper.Path.Ellipse(rectangle);
                    path.rotate((ellipse.rotation * 180) / Math.PI, createPointFromIPoint(ellipse.center));
                    if (ellipse.style?.strokeColor) {
                        path.strokeColor = createPaperColor(ellipse.style.strokeColor);
                    }
                    if (ellipse.style?.fillColor) {
                        path.fillColor = createPaperColor(ellipse.style.fillColor);
                    }
                    if (ellipse.style?.strokeWidth) {
                        path.strokeWidth = ellipse.style.strokeWidth;
                    }
                    break;
                }
                case NotabilityShapeType.TRIANGLE: {
                    const triangle = shape as NotabilityShapeTriangle;
                    const points = triangle.points.map(v => createPointFromIPoint(v));
                    const path = new Paper.Path();
                    path.moveTo(points[0]);
                    path.add(points[1])
                    path.add(points[2]);
                    path.add(points[0]);
                    if (triangle.style?.strokeColor) {
                        path.strokeColor = createPaperColor(triangle.style.strokeColor);
                    }
                    if (triangle.style?.fillColor) {
                        path.fillColor = createPaperColor(triangle.style.fillColor);
                    }
                    if (triangle.style?.strokeWidth) {
                        path.strokeWidth = triangle.style.strokeWidth;
                    }
                    break;
                }
            }
        }
    }
}
