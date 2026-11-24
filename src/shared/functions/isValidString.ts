import type {UuidString} from "../types";
import {isValid} from "./isValid";

export function isValidString(input: unknown): input is UuidString {
  return typeof input === "string" && input.length === 36 && isValid(input);
}
