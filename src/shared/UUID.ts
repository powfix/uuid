import {canonicalToHex, uuidValues} from "./encoding";
import * as functions from "./functions";
import type {CanonicalUuid, NullableUuidInput, UuidInput} from "./types";
import {Uint8ArrayUtils} from "./utils";

/** An immutable 128-bit value. Its canonical string is also its JSON representation. */
export class UUID {
  constructor(input: unknown) {
    uuidValues.set(this, functions.format(input));
  }

  get #value(): CanonicalUuid { return uuidValues.get(this)!; }

  static format = functions.format;
  static toHex = functions.toHex;
  static toBytes = functions.toBytes;
  static parse = functions.parseUuid;
  static tryParse = functions.tryParse;
  static parseNullable = functions.parseNullable;
  static fromString = functions.fromString;
  static fromHex = functions.fromHex;
  static fromBytes = functions.fromBytes;
  static isUuidEncoding = functions.isUuidEncoding;
  static isRfcUuid = functions.isRfcUuid;
  /** @deprecated Checks RFC versions 1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with its `versions` option for an RFC policy. */
  static isValid = functions.isValid;
  /** @deprecated Checks dashed UUIDs from v1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with `encoding: "dashed"` and optional `versions`. */
  static isValidString = functions.isValidString;
  /** @deprecated Checks 32 hex digits from v1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with `encoding: "hex"` and optional `versions`. */
  static isValidHex = functions.isValidHex;
  /** @deprecated Checks v1–5 byte views. Combine `ArrayBuffer.isView` with `isUuidEncoding` or with `isRfcUuid` and its `versions` option. */
  static isValidBytes = functions.isValidBytes;
  static nil = functions.nil;
  static max = functions.max;
  static v4 = functions.v4;
  static v7 = functions.v7;
  static version = functions.version;
  static equals = functions.equals;
  static compare = functions.compare;

  static {
    // A method on a class is writable and non-enumerable, including when it is also a named export.
    for (const name of Object.keys(this)) Object.defineProperty(this, name, {enumerable: false});
  }

  /** Convenience alias preserving the nullish behavior of 0.2.19 and 0.3. */
  static readonly from = functions.parseNullable;

  equals(other: NullableUuidInput, ...rest: NullableUuidInput[]): boolean { return UUID.equals(this, other, ...rest); }
  compare(other: UuidInput): -1 | 0 | 1 { return UUID.compare(this, other); }
  version(): number { return UUID.version(this); }
  /** @deprecated Checks RFC versions 1–5. Use `isUuidEncoding(id)` or `isRfcUuid(id)` with its optional `versions` policy. */
  isValid(): boolean { return UUID.isValid(this); }
  toString(): CanonicalUuid { return this.#value; }
  toJSON(): CanonicalUuid { return this.#value; }
  toHex(): string { return canonicalToHex(this.#value); }
  toBytes(): Uint8Array { return Uint8ArrayUtils.fromHex(this.toHex()); }
  /** A fresh copy, just like toBytes(). */
  get bytes(): Uint8Array { return this.toBytes(); }
}
