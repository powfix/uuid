export function randomBytes(version: 4 | 7): Uint8Array {
  const crypto = globalThis.crypto;
  if (typeof crypto?.getRandomValues !== "function") throw new Error("UUID generation requires crypto.getRandomValues");
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | (version << 4);
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes;
}
