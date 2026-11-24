import type {UUID} from "../UUID";
import {parseUuid} from "./parseUuid";

export function fromBytes(input: Uint8Array): UUID {
  if (!ArrayBuffer.isView(input)) throw new TypeError("Expected 16 UUID bytes");
  return parseUuid(input);
}
