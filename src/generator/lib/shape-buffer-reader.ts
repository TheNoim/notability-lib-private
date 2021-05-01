
export enum SerializationType {
    UInt32 = 4, // 4 bytes LE
    UInt8 = 1, // 1 byte LE
    Float64 = 8 // 8 bytes LE
}

export class ShapeBufferReader {

    // SRC: https://github.com/hfutrell/BezierKit/blob/90d1fa87c1647762917ea402e96677e5d0cd2c65/BezierKit/Library/Path%2BData.swift#L45
    private static SerializationTypesLengthMap = {
        MagicNumber: SerializationType.UInt32,
        CommandCount: SerializationType.UInt32,
        Command: SerializationType.UInt8,
        Coordinate: SerializationType.Float64
    }

    private offset: number = 0;

    constructor(private readonly buffer: Buffer) {}

    /**
     * Read specific type and moves the read head
     * @param type
     */
    public readValue<TYPE extends SerializationType>(type: TYPE): number {
        let data: number;
        switch (type) {
            case SerializationType.UInt32:
                data = this.buffer.readUInt32LE(this.offset);
                break;
            case SerializationType.UInt8:
                data = this.buffer.readUIntLE(this.offset, 1);
                break;
            case SerializationType.Float64:
                data = this.buffer.readDoubleLE(this.offset);
                break;
            default:
                throw new Error('Unknown type to read');
        }
        this.offset += type;
        return data;
    }
}
