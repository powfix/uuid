import type {NullableUuidInput} from "../types";
import {format} from "./format";

export function equals(first: NullableUuidInput, second: NullableUuidInput, ...rest: NullableUuidInput[]): boolean {
  if (arguments.length < 2) throw new TypeError("Expected at least two UUIDs");
  if (first == null || second == null) return false;
  const reference = format(first);
  if (reference !== format(second)) return false;
  return rest.every(value => value != null && reference === format(value));
}
