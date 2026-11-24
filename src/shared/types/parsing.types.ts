import type {NullableUuidInput, UuidInput} from "./input.types";

export type ParsedNullable<T extends NullableUuidInput, Value> = T extends null | undefined ? T : Value;

/** Known inputs yield a UUID, nullable unions preserve their empty branches, and unknown inputs are checked. */
export interface NullableParser<Value> {
  <T extends UuidInput>(input: T): Value;
  <T extends NullableUuidInput>(input: T): ParsedNullable<T, Value>;
  (input: unknown): Value | null | undefined;
}
