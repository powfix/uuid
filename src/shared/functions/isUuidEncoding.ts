import {readUuid} from "../encoding";
import type {UuidInput} from "../types";

/** Check the input encoding, independent of version and variant bits. */
export function isUuidEncoding(input: unknown): input is UuidInput {
  return readUuid(input) !== undefined;
}
