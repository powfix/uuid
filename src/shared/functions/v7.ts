import type {UUID} from "../UUID";
import {randomBytes} from "../randomBytes";
import {fromBytes} from "./fromBytes";

/** RFC 9562 v7. IDs in the same millisecond use independent random bits. */
export function v7(): UUID {
  let timestamp = Date.now();
  if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > 0xffffffffffff) {
    throw new RangeError("UUIDv7 requires an unsigned 48-bit Unix timestamp in milliseconds");
  }
  const bytes = randomBytes(7);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  return fromBytes(bytes);
}
