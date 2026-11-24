import {isValid} from "./isValid";

export function isValidHex(input: unknown): input is string {
  return typeof input === "string" && input.length === 32 && isValid(input);
}
