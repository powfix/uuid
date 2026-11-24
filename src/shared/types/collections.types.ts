import type {UuidInput} from "./input.types";

export interface UuidSetLike<T = UuidInput> {
  readonly size: number;
  has(value: T): boolean;
  keys(): Iterator<T>;
}

export type UuidSetOperand = Iterable<UuidInput> | UuidSetLike;
