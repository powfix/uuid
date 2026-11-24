import {isValid} from "./isValid";

/** @deprecated Checks 32 hex digits from v1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with `encoding: "hex"` and optional `versions`. */
export function isValidHex(input: unknown): input is string {
  return typeof input === "string" && input.length === 32 && isValid(input);
}
