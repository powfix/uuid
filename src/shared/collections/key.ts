import {UUID} from "../UUID";
import type {UuidInput} from "../types";

/** Parse from bytes every time: a UUID instance may have stale string caches. */
export function uuidKey(input: UuidInput): string {
  if (input == null) throw new TypeError("UUID collection keys cannot be null or undefined");
  // Validate collection keys without changing the existing UUID parser contract.
  if (typeof input === "string" && !/^(?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.test(input)) {
    throw new TypeError("Expected a hexadecimal or canonical UUID string");
  }
  const uuid = UUID.from(input);
  if (uuid.bytes.byteLength !== 16) throw new TypeError("Expected 16 UUID bytes");
  return uuid.toHex();
}

/** Keep representation types, but never expose the mutable stored key. */
export function copyKey<K extends UuidInput>(key: K): K {
  if (typeof key === "string") return key;
  if (key instanceof UUID) {
    return (key.constructor as typeof UUID).from(key) as K;
  }
  // Unlike Buffer.slice(), TypedArray.map() allocates an independent copy.
  return key.map(byte => byte) as K;
}
