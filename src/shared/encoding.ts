import type {CanonicalUuid} from "./types";

const hexPattern = /^[0-9a-f]{32}$/i;
const dashedPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const bytes = value as Uint8Array;
  let hex = "";
  for (let i = 0; i < 16; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return dashed(hex);
}

export function readUuid(value: unknown): CanonicalUuid | undefined {
  if (typeof value === "string") {
    if (value.length === 36 && dashedPattern.test(value)) return value.toLowerCase() as CanonicalUuid;
    if (value.length === 32 && hexPattern.test(value)) return dashed(value.toLowerCase());
    return undefined;
  }
  if (value === null || typeof value !== "object") return undefined;
  if (ArrayBuffer.isView(value)) return readBytes(value);

  // A different installation (including 0.x) can supply its bytes without sharing a prototype.
  try {
    const source = value as {toBytes?: () => unknown};
    return typeof source.toBytes === "function" ? readBytes(source.toBytes()) : undefined;
  } catch {
    return undefined;
  }
}

export function formatUuid(value: unknown): CanonicalUuid {
  const result = readUuid(value);
  if (result === undefined) throw new TypeError("Expected a dashed UUID, 32 hexadecimal digits, or 16 UUID bytes");
  return result;
}
