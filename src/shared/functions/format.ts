import {readUuid} from "../encoding";
import type {CanonicalUuid} from "../types";

/** Return the lowercase dashed key without allocating a UUID object. */
export function format(input: unknown): CanonicalUuid {
  const value = readUuid(input);
  if (value === undefined) throw new TypeError("Expected a dashed UUID, 32 hexadecimal digits, or 16 UUID bytes");
  return value;
}
