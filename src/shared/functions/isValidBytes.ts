import {isValid} from "./isValid";

export function isValidBytes(input: unknown): input is Uint8Array {
  return ArrayBuffer.isView(input) && isValid(input);
}
