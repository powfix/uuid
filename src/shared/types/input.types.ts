/** UUID values from this package or another installation, including 0.x. */
export interface UuidByteSource {
  toBytes(): Uint8Array;
}

export type UuidInput = string | Uint8Array | UuidByteSource;
export type NullableUuidInput = UuidInput | null | undefined;
export type NonNullableUuidInput = UuidInput;
