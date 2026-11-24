import type {UuidInput} from "../types";
import {format} from "./format";

/** Read the four version bits, including the raw nibble of an opaque identifier. */
export function version(input: UuidInput): number {
  return Number.parseInt(format(input)[14], 16);
}
