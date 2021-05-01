import {CGPath, CGPathInstruction, CGPathInstructionType} from "./IShapes";
import {SerializationType, ShapeBufferReader} from "./shape-buffer-reader";

export function createBezierKitPath(data: Buffer): CGPath {
    const reader = new ShapeBufferReader(data);

    const magicNumber = reader.readValue(SerializationType.UInt32);

    if (magicNumber !== 1223013157) {
        throw new Error('Magic number mismatch');
    }

    const commandCount = reader.readValue(SerializationType.UInt32);

    type Point = { x: number; y: number; };

    const pathComponents: { points: Point[]; orders: number[]; }[] = [];

    const commands: number[] = [];

    for (let i = 0; i < commandCount; i++) {
        commands.push(reader.readValue(SerializationType.UInt8));
    }

    let currentOrders: number[] = [];
    let currentPoints: Point[] = [];
    for (const command of commands) {
        let pointsToRead = command
        console.log({ command });
        if (command === 0) {
            if (currentPoints.length === 0 || currentOrders.length !== 0) {
                pointsToRead = 1;
            }
            if (currentPoints.length !== 0) {
                if (currentOrders.length === 0) {
                    currentOrders.push(0);
                }
                pathComponents.push({
                    points: currentPoints,
                    orders: currentOrders
                });
                currentOrders = [];
                currentPoints = [];
            }
        } else {
            currentOrders.push(pointsToRead);
        }
        for (let i2 = 0; i2 < pointsToRead; i2++) {
            console.log({i2,pointsToRead})
            const x = reader.readValue(SerializationType.Float64);
            const y = reader.readValue(SerializationType.Float64);
            console.log({x,y,i2,pointsToRead})
            currentPoints.push({ x, y });
        }
    }
    if (currentOrders.length !== 0) {
        pathComponents.push({
            points: currentPoints,
            orders: currentOrders
        });
    }

    let cgPathInstructions: CGPathInstruction[] = [];

    for (const component of pathComponents) {
        const startingPoint = component.points[0];
        cgPathInstructions.push({
            type: CGPathInstructionType.MOVE_TO,
            to: startingPoint
        });
        // https://github.com/hfutrell/BezierKit/blob/90d1fa87c1647762917ea402e96677e5d0cd2c65/BezierKit/Library/PathComponent.swift#L153
        const offsets = ((orders) => {
            const buffer: number[] = [];
            let sum = 0;
            buffer[0] = 0;
            for (let i = 1; i < orders.length; i++) {
                sum += orders[i-1];
                buffer[i] = sum;
            }
            return buffer;
        })(component.orders);
        const isClosed = component.points[0].x === component.points[component.points.length-1].x && component.points[0].y === component.points[component.points.length-1].y;
        for (let i = 0; i < component.orders.length; i++) {
            const order = component.orders[i];
            const offset = offsets[i];
            if (i === component.orders.length-1 && isClosed && order === 1) {
                cgPathInstructions.push({
                    type: CGPathInstructionType.ADD_LINE,
                    to: startingPoint
                });
                break;
            }
            switch (order) {
                case 1:
                    cgPathInstructions.push({
                        type: CGPathInstructionType.ADD_LINE,
                        to: component.points[offset+1]
                    })
                    break;
                case 2:
                    cgPathInstructions.push({
                        type: CGPathInstructionType.ADD_QUAD_CURVE,
                        to: component.points[offset+2],
                        control: component.points[offset+1]
                    })
                    break;
                case 3:
                    cgPathInstructions.push({
                        type: CGPathInstructionType.ADD_CURVE,
                        to: component.points[offset+3],
                        control1: component.points[offset+1],
                        control2: component.points[offset+2]
                    })
                    break;
            }
        }
    }

    return {
        instructions: cgPathInstructions
    }
}
