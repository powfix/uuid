import type {UuidString} from "../types";
import {isValid} from "./isValid";

/** @deprecated Checks dashed UUIDs from v1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with `encoding: "dashed"` and optional `versions`. */
export function isValidString(input: unknown): input is UuidString {
  return typeof input === "string" && input.length === 36 && isValid(input);
}
