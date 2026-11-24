import type {UUID} from "../UUID";
import {parseUuid} from "./parseUuid";

export function fromString(input: string): UUID {
  if (typeof input !== "string") throw new TypeError("Expected a UUID string");
  return parseUuid(input);
}
