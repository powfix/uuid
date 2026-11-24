import type {UuidInput, UuidPolicy} from "../types";
import {isRfcUuid} from "./isRfcUuid";

const legacyPolicy: UuidPolicy = {versions: [1, 2, 3, 4, 5]};

/** Historical validator for the RFC variant and versions 1–5. */
export function isValid(input: unknown): input is UuidInput {
  return isRfcUuid(input, legacyPolicy);
}
