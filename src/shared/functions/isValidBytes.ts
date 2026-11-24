import {isValid} from "./isValid";

/** @deprecated Checks v1–5 byte views. Combine `ArrayBuffer.isView` with `isUuidEncoding` or with `isRfcUuid` and its `versions` option. */
export function isValidBytes(input: unknown): input is Uint8Array {
  return ArrayBuffer.isView(input) && isValid(input);
}
