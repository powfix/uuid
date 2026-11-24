import type {UuidInput} from "../types";
import {Uint8ArrayUtils} from "../utils";
import {toHex} from "./toHex";

/** Return an independent 16-byte Uint8Array in network byte order. */
export function toBytes(input: UuidInput): Uint8Array {
  return Uint8ArrayUtils.fromHex(toHex(input));
}
