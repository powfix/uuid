import {Buffer} from "node:buffer";
import {format} from "../shared/functions/format";
import type {UuidInput} from "../shared/types";

/** Convert any supported UUID representation into an independent, 16-byte Node Buffer. */
export function toBuffer(input: UuidInput): Buffer {
  return Buffer.from(format(input).replace(/-/g, ""), "hex");
}
