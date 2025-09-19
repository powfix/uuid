import {Uint8ArrayUtils} from "./utils";
import {UuidInput} from "./types";
import crypto from 'crypto';

/**
 * Represents a UUID (Universally Unique Identifier) and provides various utility
 * methods for validation, conversion, comparison and creation.
 */
export class UUID {
  /* --------------------------------------------------------------------
   * Regular expressions used to validate UUIDs in different string forms
   * -------------------------------------------------------------------- */

  /** Matches a 32‑character hexadecimal representation of a UUID without hyphens. */
  private static REGEX_HEX: RegExp = /^[0-9a-fA-F]{8}[0-9a-fA-F]{4}[1-5][0-9a-fA-F]{3}[89abAB][0-9a-fA-F]{3}[0-9a-fA-F]{12}$/;

  /** Matches the RFC 4122 canonical UUID format with hyphens. */
  private static REGEX_RFC4122: RegExp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  /* --------------------------------------------------------------------
   * Constant lengths used throughout the class
   * -------------------------------------------------------------------- */

  /** Number of bytes that represent a UUID. */
  private static BYTE_LENGTH: number = 16;
  /** Total length of an RFC 4122 UUID string (including hyphens). */
  private static STR_LENGTH: number = 36;
  /** Length of a UUID represented as a plain hexadecimal string. */
  private static HEX_STR_LENGTH: number = 32;

  /* --------------------------------------------------------------------
   * Validation helpers
   * -------------------------------------------------------------------- */

  /**
   * Checks if the supplied value is a valid hex representation of a UUID.
   * @param hex - The string to validate.
   * @returns true if the string matches {@link REGEX_HEX}.
   */
  public static isValidHex(hex: string): boolean {
    if (typeof hex !== 'string') {
      return false;
    }
    return UUID.REGEX_HEX.test(hex);
  }

  /**
   * Checks if the supplied value is a valid RFC 4122 UUID string.
   * @param str - The string to validate.
   * @returns true if the string matches {@link REGEX_RFC4122}.
   */
  public static isValidString(str: string): boolean {
    if (typeof str !== 'string') {
      return false;
    }
    return UUID.REGEX_RFC4122.test(str);
  }

  /**
   * Checks whether an Uint8Array contains exactly {@link BYTE_LENGTH} bytes.
   * @param bytes - The view to check.
   * @returns true if the byte length is correct.
   */
  public static isValidBytes(bytes: Uint8Array): boolean {
    if (bytes.byteLength !== UUID.BYTE_LENGTH) {
      return false;
    }

    const version = this.version(bytes);
    if (version < 1 || version > 5) {
      return false;
    }

    const variant = (bytes[8] & 0xc0) >> 6;
    if (variant !== 0b10) {
      return false;
    }

    return true;
  }

  /**
   * Generic validation that accepts either a string (hex or RFC 4122 format)
   * or an Uint8Array containing the raw bytes.
   * @param input - The value to validate.
   * @returns true if the input is a valid representation of a UUID.
   */
  public static isValid(input: UuidInput | null | undefined): boolean {
    if (input == null) {
      return false;
    }

    if (typeof input === 'string') {
      const length: number = input.length;
      switch (length) {
        case UUID.STR_LENGTH:
          // RFC 4122 uuid(string)
          // 9e472052-a654-4693-9a8b-3ce57ada3d6c
          return UUID.isValidString(input);
        case UUID.HEX_STR_LENGTH:
          // RFC 4122 uuid(string) without hyphens
          // 9e472052a65446939a8b3ce57ada3d6c
          return UUID.isValidHex(input);
        default:
          return false;
      }
    } else if (input instanceof UUID) {
      return UUID.isValidBytes(input.bytes);
    } else if (input instanceof Uint8Array) {
      return UUID.isValidBytes(input);
    } else {
      return false;
    }
  }

  public static version(input: UuidInput): number {
    if (input instanceof Uint8Array) {
      if (input.byteLength !== this.BYTE_LENGTH) {
        throw new Error(`Invalid UUID byte length: expected ${this.BYTE_LENGTH}, got ${input.byteLength}`);
      }
      return input[6] >> 4;
    }
    return this.version(this.parse(input));
  }

  /* --------------------------------------------------------------------
   * Parsing / formatting helpers
   * -------------------------------------------------------------------- */

  /**
   * Inserts hyphens into a 32‑character hex string to produce an RFC 4122 string.
   * @param hex - The plain hexadecimal UUID.
   * @returns The formatted RFC 4122 string.
   */
  private static formatHex(hex: string): string {
    if (hex.length !== UUID.HEX_STR_LENGTH) {
      throw new Error(`hex length should be ${UUID.HEX_STR_LENGTH}`);
    }
    return hex.slice(0, 8) + '-' +
      hex.slice(8, 12) + '-' +
      hex.slice(12, 16) + '-' +
      hex.slice(16, 20) + '-' +
      hex.slice(20);
  }

  /** Removes all hyphens from a UUID string. */
  private static stripHyphens(str: string): string {
    return str.replace(/-/g, "");
  }

  /**
   * Converts a plain hexadecimal UUID into a Uint8Array.
   * @param hex - The hex string to parse.
   * @returns A Uint8Array containing the raw bytes.
   */
  private static parseHex(hex: string): Uint8Array {
    return Uint8ArrayUtils.fromHex(hex);
  }

  /**
   * Parses an RFC 4122 string into a Uint8Array.
   * @param str - The formatted UUID string.
   * @returns A Uint8Array containing the raw bytes.
   */
  private static parseString(str: string): Uint8Array {
    const hex = UUID.stripHyphens(str);
    return this.parseHex(hex);
  }

  /**
   * Parses an Uint8Array into a Uint8Array ensuring the correct byte length.
   * @param input - The view to parse.
   * @returns A Uint8Array containing the raw bytes.
   */
  private static parseBytes(input: Uint8Array): Uint8Array {
    if (!(input instanceof Uint8Array)) {
      throw new TypeError("Expected input to be Uint8Array");
    }
    return new Uint8Array(input);
  }

  /* --------------------------------------------------------------------
   * Factory methods
   * -------------------------------------------------------------------- */

  /**
   * Creates a UUID instance from a plain hexadecimal string.
   * @param hex - The hex representation of the UUID.
   * @returns A new {@link UUID} object.
   */
  public static fromHex<T extends typeof UUID>(this: T, hex: string): InstanceType<T> {
    return new this(this.parseHex(hex)) as InstanceType<T>;
  }

  /**
   * Creates a UUID instance from an RFC 4122 formatted string.
   * @param str - The UUID string with hyphens.
   * @returns A new {@link UUID} object.
   */
  public static fromString<T extends typeof UUID>(this: T, str: string): InstanceType<T> {
    return new this(this.parseString(str)) as InstanceType<T>;
  }

  /**
   * Creates a UUID instance from raw bytes.
   * @param bytes - An Uint8Array containing 16 bytes.
   * @returns A new {@link UUID} object.
   */
  public static fromBytes<T extends typeof UUID>(this: T, bytes: Uint8Array): InstanceType<T> {
    return new this(this.parseBytes(bytes)) as InstanceType<T>;
  }

  /**
   * Parses any supported input (string or bytes) and returns the raw byte array.
   * @param input - The value to parse.
   * @returns A Uint8Array of length {@link BYTE_LENGTH}.
   */
  private static parse<T extends typeof UUID>(this: T, input: UuidInput): Uint8Array {
    if (typeof input === 'string') {
      const length: number = input.length;
      switch (length) {
        case UUID.STR_LENGTH:
          // RFC 4122 uuid(string)
          return this.parseString(input);
        case UUID.HEX_STR_LENGTH:
          // RFC 4122 uuid(string) without hyphens
          return this.parseHex(input);
        default:
          throw new Error(`Invalid input string, length should be ${UUID.STR_LENGTH} or ${UUID.HEX_STR_LENGTH}`);
      }
    }

    if (input instanceof Uint8Array) {
      return this.parseBytes(input);
    }

    if (input instanceof UUID) {
      return input.toBytes();
    }

    if (input == null) {
      throw new Error(`Not expected invalid input received: ${input}`);
    } else if (typeof input === 'object') {
      throw new Error(`Not expected invalid input received: [${typeof input}] ${JSON.stringify(input)}`);
    } else {
      throw new Error(`Not expected invalid input received: [${typeof input}] ${input}`);
    }
  }

  /**
   * Creates a UUID from any supported input type.
   * @param input - The value to parse.
   * @returns A new {@link UUID} object.
   */
  public static from<T extends typeof UUID>(this: T, input: UuidInput): InstanceType<T> {
    return this.fromBytes(UUID.parse(input)) as InstanceType<T>;
  }

  /** Returns the nil (all zero) UUID. */
  public static nil<T extends typeof UUID>(this: T): InstanceType<T> {
    return this.fromBytes(new Uint8Array(UUID.BYTE_LENGTH)) as InstanceType<T>;
  }

  /** Returns a UUID consisting of all 0xFF bytes. */
  public static max<T extends typeof UUID>(this: T): InstanceType<T> {
    return this.fromBytes((new Uint8Array(UUID.BYTE_LENGTH)).fill(0xFF)) as InstanceType<T>;
  }

  public static v4<T extends typeof UUID>(this: T): InstanceType<T> {
    return this.fromString(crypto.randomUUID());
  }

  /* --------------------------------------------------------------------
   * Equality / comparison
   * -------------------------------------------------------------------- */

  /**
   * Compares multiple UUIDs for strict equality.
   * @param inputs - The UUIDs to compare (at least two required).
   * @returns true if all provided UUIDs are identical.
   */
  public static equals(...inputs: (UuidInput | null | undefined)[]): boolean {
    const inputLength = inputs.length;
    if (inputLength < 2) {
      throw new Error('At least two UUIDs required for comparison');
    }

    if (inputs[0] == null) {
      return false;
    }

    const ref = this.parse(inputs[0]);

    for (let i = 1; i < inputLength; ++i) {
      const input = inputs[i];
      if (input == null) {
        return false;
      }

      const b = this.parse(input);
      for (let j = 0; j < UUID.BYTE_LENGTH; ++j) {
        if (ref[j] !== b[j]) return false;
      }
    }
    return true;
  }

  /**
   * Lexicographically compares two UUIDs.
   * @param uuid1 - The first UUID.
   * @param uuid2 - The second UUID.
   * @returns -1 if uuid1 < uuid2, 1 if uuid1 > uuid2, 0 otherwise.
   */
  public static compare(uuid1: UuidInput, uuid2: UuidInput): number {
    const a = this.parse(uuid1);
    const b = this.parse(uuid2);
    for (let i = 0; i < UUID.BYTE_LENGTH; i++) {
      if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    }
    return 0;
  }

  /* --------------------------------------------------------------------
   * Instance members
   * -------------------------------------------------------------------- */

  /** Raw byte representation of the UUID. */
  public readonly bytes: Uint8Array;

  // Cached string and hex representations to avoid recomputation.
  protected _str?: string;
  protected _hex?: string;

  /**
   * Constructs a new {@link UUID} instance from any supported input type.
   * @param input - The value to parse (UuidInput = string | UuidString | Uint8Array | UUID).
   */
  public constructor(input: UuidInput) {
    this.bytes = UUID.parse(input);
  }

  /** Instance wrapper for {@link equals}. */
  public equals(...inputs: (UuidInput | null | undefined)[]): boolean {
    return UUID.equals(this, ...inputs);
  }

  /** Instance wrapper for {@link compare}. */
  public compare(other: UuidInput): number {
    return UUID.compare(this, other);
  }

  public version(): number {
    return UUID.version(this.bytes);
  }

  /**
   * Returns the RFC 4122 string representation of this UUID.
   * @returns The formatted UUID string.
   */
  public toString(): string {
    if (this._str != null) {
      return this._str;
    }
    const hex = this.toHex();
    this._str = UUID.formatHex(hex);
    return this._str;
  }

  /**
   * Returns the plain hexadecimal representation of this UUID.
   * @returns A 32‑character hex string.
   */
  public toHex(): string {
    if (this._hex != null) {
      return this._hex;
    }
    this._hex = Uint8ArrayUtils.toHex(this.bytes);
    return this._hex;
  }

  /**
   * Returns a copy of the raw byte array.
   * @returns A new Uint8Array containing the UUID bytes.
   */
  public toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }

  /** JSON serialization helper – returns the RFC 4122 string. */
  public toJSON(): string {
    return this.toString();
  }
}
