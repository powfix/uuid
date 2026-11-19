const hexPairs = Array.from({length: 256}, (_, byte) => byte.toString(16).padStart(2, "0"));
const hexDigits = /^[0-9a-f]*$/i;

export class Uint8ArrayUtils {
  /** Decode complete pairs of hexadecimal digits. The empty string represents zero bytes. */
  public static fromHex(hex: string): Uint8Array {
    if (typeof hex !== "string" || hex.length % 2 !== 0 || !hexDigits.test(hex)) {
      throw new TypeError("Expected an even number of hexadecimal digits");
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  public static toHex(bytes: Uint8Array): string {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) hex += hexPairs[bytes[i]];
    return hex;
  }
}
