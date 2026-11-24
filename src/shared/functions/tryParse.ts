import type {UUID} from "../UUID";
import {parseUuid} from "./parseUuid";

/** Return undefined for malformed or absent input. */
export function tryParse(input: unknown): UUID | undefined {
  try {
    return parseUuid(input);
  } catch {
    return undefined;
  }
}
