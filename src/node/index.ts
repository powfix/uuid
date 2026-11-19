import {Buffer} from "node:buffer";
import {UUID} from "../shared/UUID";
import type {UuidInput} from "../shared/types";

/** Convert any supported UUID representation into an independent, 16-byte Node Buffer. */
export function toBuffer(input: UuidInput): Buffer {
  return Buffer.from(UUID.format(input).replace(/-/g, ""), "hex");
}
