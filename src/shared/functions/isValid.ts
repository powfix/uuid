import type {UuidInput, UuidPolicy} from "../types";
import {isRfcUuid} from "./isRfcUuid";

const legacyPolicy: UuidPolicy = {versions: [1, 2, 3, 4, 5]};

/** @deprecated Checks RFC versions 1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with its `versions` option for an RFC policy. */
export function isValid(input: unknown): input is UuidInput {
  return isRfcUuid(input, legacyPolicy);
}
