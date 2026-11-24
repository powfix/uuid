import type {UUID} from "../UUID";
import type {NullableUuidInput, UuidInput} from "../types";
import type {ParsedNullable} from "../types/parsing.types";
import {parseUuid} from "./parseUuid";

/** Preserve null and undefined. Other malformed inputs throw TypeError. */
export function parseNullable<T extends UuidInput>(input: T): UUID;
export function parseNullable<T extends NullableUuidInput>(input: T): ParsedNullable<T, UUID>;
export function parseNullable(input: unknown): UUID | null | undefined;
export function parseNullable(input: unknown): UUID | null | undefined {
  if (input === null || input === undefined) return input;
  return parseUuid(input);
}
