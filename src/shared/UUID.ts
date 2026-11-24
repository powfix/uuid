import {readUuid} from "./encoding";
import type {CanonicalUuid, NullableUuidInput, UuidInput, UuidPolicy, UuidString, UuidVersion} from "./types";
import type {ParsedNullable} from "./types/parsing.types";
import {Uint8ArrayUtils} from "./utils";

const nil: string = "00000000-0000-0000-0000-000000000000";
const max: string = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const legacyPolicy: UuidPolicy = {versions: [1, 2, 3, 4, 5]};

function randomBytes(version: 4 | 7): Uint8Array {
  const crypto = globalThis.crypto;
  if (typeof crypto?.getRandomValues !== "function") throw new Error("UUID generation requires crypto.getRandomValues");
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | (version << 4);
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes;
}

/** An immutable 128-bit value. Its canonical string is also its JSON representation. */
export class UUID {
  readonly #value: CanonicalUuid;

  constructor(input: unknown) {
    this.#value = UUID.format(input);
  }

  static #isOwn(value: unknown): value is UUID {
    return typeof value === "object" && value !== null && #value in value;
  }

  static #read(input: unknown): CanonicalUuid | undefined {
    return UUID.#isOwn(input) ? input.#value : readUuid(input);
  }

  /** Return the lowercase dashed key without allocating a UUID object. */
  static format(input: unknown): CanonicalUuid {
    const value = UUID.#read(input);
    if (value === undefined) throw new TypeError("Expected a dashed UUID, 32 hexadecimal digits, or 16 UUID bytes");
    return value;
  }

  /** Parse any supported representation. Malformed and nullish inputs throw TypeError. */
  static parse(input: unknown): UUID {
    return UUID.#isOwn(input) ? input : new UUID(input);
  }

  /** Return undefined for malformed or absent input. */
  static tryParse(input: unknown): UUID | undefined {
    try {
      return UUID.parse(input);
    } catch {
      return undefined;
    }
  }

  // Infer a UUID for unchecked middleware inputs while preserving explicitly nullable unions.
  static parseNullable<T extends UuidInput>(input: T): UUID;
  static parseNullable<T extends NullableUuidInput>(input: T): ParsedNullable<T, UUID>;
  static parseNullable(input: unknown): UUID | null | undefined;
  static parseNullable(input: unknown): UUID | null | undefined {
    if (input === null || input === undefined) return input;
    return UUID.parse(input);
  }

  /** Convenience alias preserving the nullish behavior of 0.2.19 and 0.3. */
  static readonly from = UUID.parseNullable;

  static fromString(input: string): UUID {
    if (typeof input !== "string") throw new TypeError("Expected a UUID string");
    return UUID.parse(input);
  }

  static fromHex(input: string): UUID {
    if (typeof input !== "string" || input.length !== 32) throw new TypeError("Expected 32 hexadecimal digits");
    return UUID.parse(input);
  }

  static fromBytes(input: Uint8Array): UUID {
    if (!ArrayBuffer.isView(input)) throw new TypeError("Expected 16 UUID bytes");
    return UUID.parse(input);
  }

  /** Check the input encoding, independent of version and variant bits. */
  static isUuidEncoding(input: unknown): input is UuidInput {
    return UUID.#read(input) !== undefined;
  }

  static isRfcUuid(input: unknown, policy: UuidPolicy = {}): input is UuidInput {
    if (policy.encoding !== undefined) {
      const length = policy.encoding === "dashed" ? 36 : 32;
      if (typeof input !== "string" || input.length !== length) return false;
    }
    const value = UUID.#read(input);
    if (value === undefined) return false;
    if (value === nil) return policy.allowNil ?? (policy.versions === undefined);
    if (value === max) return policy.allowMax ?? (policy.versions === undefined);
    const version = Number.parseInt(value[14], 16);
    return version >= 1 && version <= 8 && "89ab".includes(value[19]) &&
      (policy.versions === undefined || policy.versions.includes(version as UuidVersion));
  }

  /** Historical validators retain the RFC variant and versions 1–5. */
  static isValid(input: unknown): input is UuidInput { return UUID.isRfcUuid(input, legacyPolicy); }
  static isValidString(input: unknown): input is UuidString {
    return typeof input === "string" && input.length === 36 && UUID.isValid(input);
  }
  static isValidHex(input: unknown): input is string {
    return typeof input === "string" && input.length === 32 && UUID.isValid(input);
  }
  static isValidBytes(input: unknown): input is Uint8Array {
    return ArrayBuffer.isView(input) && UUID.isValid(input);
  }

  static nil(): UUID { return UUID.parse(nil); }
  static max(): UUID { return UUID.parse(max); }

  static v4(): UUID { return UUID.fromBytes(randomBytes(4)); }

  /** RFC 9562 v7. IDs in the same millisecond use independent random bits. */
  static v7(): UUID {
    let timestamp = Date.now();
    if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > 0xffffffffffff) {
      throw new RangeError("UUIDv7 requires an unsigned 48-bit Unix timestamp in milliseconds");
    }
    const bytes = randomBytes(7);
    for (let i = 5; i >= 0; i--) {
      bytes[i] = timestamp % 256;
      timestamp = Math.floor(timestamp / 256);
    }
    return UUID.fromBytes(bytes);
  }

  /** Read the four version bits, including the raw nibble of an opaque identifier. */
  static version(input: UuidInput): number { return Number.parseInt(UUID.format(input)[14], 16); }

  static equals(first: NullableUuidInput, second: NullableUuidInput, ...rest: NullableUuidInput[]): boolean {
    if (arguments.length < 2) throw new TypeError("Expected at least two UUIDs");
    if (first == null || second == null) return false;
    const reference = UUID.format(first);
    if (reference !== UUID.format(second)) return false;
    return rest.every(value => value != null && reference === UUID.format(value));
  }

  static compare(left: UuidInput, right: UuidInput): -1 | 0 | 1 {
    const a = UUID.format(left);
    const b = UUID.format(right);
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }

  equals(other: NullableUuidInput, ...rest: NullableUuidInput[]): boolean { return UUID.equals(this, other, ...rest); }
  compare(other: UuidInput): -1 | 0 | 1 { return UUID.compare(this, other); }
  version(): number { return UUID.version(this); }
  isValid(): boolean { return UUID.isValid(this); }
  toString(): CanonicalUuid { return this.#value; }
  toJSON(): CanonicalUuid { return this.#value; }
  toHex(): string { return this.#value.replace(/-/g, ""); }
  toBytes(): Uint8Array { return Uint8ArrayUtils.fromHex(this.toHex()); }
  /** A fresh copy, just like toBytes(). */
  get bytes(): Uint8Array { return this.toBytes(); }
}

/** The same helpers are available without a class import. */
export const {parse, tryParse, parseNullable, format, isUuidEncoding, isRfcUuid, v4, v7} = UUID;
