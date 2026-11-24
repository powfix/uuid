import {canonicalToHex} from "../encoding";
import type {UuidInput} from "../types";
import {format} from "./format";

/** Return the 32 lowercase hexadecimal digits of a UUID. */
export function toHex(input: UuidInput): string {
  return canonicalToHex(format(input));
}
