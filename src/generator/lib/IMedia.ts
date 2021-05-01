import {IPoint} from "./IPoints";
import {NotabilityDrawInstruction} from "./INotabilitySession";

export interface NotabilityMedia extends NotabilityDrawInstruction {
    origin: IPoint;
    end: IPoint;
    path: string;
    zIndex: number;
    dimension: { width: number, height: number };
}
