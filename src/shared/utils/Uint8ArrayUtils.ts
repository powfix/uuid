const hexPairs = Array.from({length: 256}, (_, byte) => byte.toString(16).padStart(2, "0"));
const hexDigits = /^[0-9a-f]*$/i;

export function bytesToHex(bytes: Uint8Array, length: number): string {
  let hex = "";
  for (let i = 0; i < length; i++) hex += hexPairs[bytes[i]];
  return hex;
}

function nibble(code: number): number {
  // ASCII digits occupy 0x30–39; lowercase and uppercase A–F differ by bit 0x20.
  return code <= 57 ? code - 48 : (code | 32) - 87;
}

export class Uint8ArrayUtils {
  /** Decode complete pairs of hexadecimal digits. The empty string represents zero bytes. */
  static fromHex(hex: string): Uint8Array {
    if (typeof hex !== "string" || hex.length % 2 !== 0 || !hexDigits.test(hex)) {
      throw new TypeError("Expected an even number of hexadecimal digits");
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = (nibble(hex.charCodeAt(i * 2)) << 4) | nibble(hex.charCodeAt(i * 2 + 1));
    }
    return bytes;
  }

  static toHex(bytes: Uint8Array): string { return bytesToHex(bytes, bytes.length); }
}
