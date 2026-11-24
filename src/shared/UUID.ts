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

  static readonly format = functions.format;
  static readonly toHex = functions.toHex;
  static readonly toBytes = functions.toBytes;
  static readonly parse = functions.parseUuid;
  static readonly tryParse = functions.tryParse;
  static readonly parseNullable = functions.parseNullable;
  static readonly fromString = functions.fromString;
  static readonly fromHex = functions.fromHex;
  static readonly fromBytes = functions.fromBytes;
  static readonly isUuidEncoding = functions.isUuidEncoding;
  static readonly isRfcUuid = functions.isRfcUuid;
  /** @deprecated Checks RFC versions 1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with its `versions` option for an RFC policy. */
  static readonly isValid = functions.isValid;
  /** @deprecated Checks dashed UUIDs from v1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with `encoding: "dashed"` and optional `versions`. */
  static readonly isValidString = functions.isValidString;
  /** @deprecated Checks 32 hex digits from v1–5. Use `isUuidEncoding` for the encoding or `isRfcUuid` with `encoding: "hex"` and optional `versions`. */
  static readonly isValidHex = functions.isValidHex;
  /** @deprecated Checks v1–5 byte views. Combine `ArrayBuffer.isView` with `isUuidEncoding` or with `isRfcUuid` and its `versions` option. */
  static readonly isValidBytes = functions.isValidBytes;
  static readonly nil = functions.nil;
  static readonly max = functions.max;
  static readonly v4 = functions.v4;
  static readonly v7 = functions.v7;
  static readonly version = functions.version;
  static readonly equals = functions.equals;
  static readonly compare = functions.compare;

  /** Convenience alias preserving the nullish behavior of 0.2.19 and 0.3. */
  static readonly from = functions.parseNullable;

  static {
    // Preserve the enumerable legacy alias when locking the static functions.
    for (const name of Object.keys(this)) {
      Object.defineProperty(this, name, {writable: false, configurable: false, enumerable: name === "from"});
    }
  }

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
