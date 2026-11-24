import type {CanonicalUuid} from "./types";
import type {UUID} from "./UUID";
import {bytesToHex} from "./utils/Uint8ArrayUtils";

const hexPattern = /^[0-9a-f]{32}$/i;
const dashedPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only locally constructed UUIDs are registered. Other installations supply their bytes.
export const uuidValues = new WeakMap<object, CanonicalUuid>();

export function isLocalUuid(input: unknown): input is UUID {
  return typeof input === "object" && input !== null && uuidValues.has(input);
}

// Use the intrinsic brand and length for views from other realms, including Node Buffers.
const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const typedArrayName = Object.getOwnPropertyDescriptor(typedArrayPrototype, Symbol.toStringTag)!.get!;
const typedArrayLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, "length")!.get!;

function dashed(hex: string): CanonicalUuid {
  return (hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" +
    hex.slice(16, 20) + "-" + hex.slice(20)) as CanonicalUuid;
}

export function readBytes(value: unknown): CanonicalUuid | undefined {
  if (!ArrayBuffer.isView(value) || typedArrayName.call(value) !== "Uint8Array" ||
      typedArrayLength.call(value) !== 16) return undefined;
  // Subarray offsets and lengths are respected by the typed array's own indexed access.
  return dashed(bytesToHex(value as Uint8Array, 16));
}

export function readUuid(value: unknown): CanonicalUuid | undefined {
  if (typeof value === "string") {
    if (value.length === 36 && dashedPattern.test(value)) return value.toLowerCase() as CanonicalUuid;
    if (value.length === 32 && hexPattern.test(value)) return dashed(value.toLowerCase());
    return undefined;
  }
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return undefined;
  if (ArrayBuffer.isView(value)) return readBytes(value);
  const own = uuidValues.get(value);
  if (own !== undefined) return own;

  // A different installation (including 0.x) can supply its bytes without sharing a prototype.
  try {
    const source = value as {toBytes?: () => unknown};
    const toBytes = source.toBytes;
    return typeof toBytes === "function" ? readBytes(toBytes.call(source)) : undefined;
  } catch {
    return undefined;
  }
}
