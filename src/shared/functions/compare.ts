import type {UuidInput} from "../types";
import {format} from "./format";

export function compare(left: UuidInput, right: UuidInput): -1 | 0 | 1 {
  const a = format(left);
  const b = format(right);
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
