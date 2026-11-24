import type {UUID} from "../UUID";
import {parseUuid} from "./parseUuid";

export function fromHex(input: string): UUID {
  if (typeof input !== "string" || input.length !== 32) throw new TypeError("Expected 32 hexadecimal digits");
  return parseUuid(input);
}
