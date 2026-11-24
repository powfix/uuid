import {UUID as SharedUUID} from "./shared/UUID";
import type {NullableUuidInput, UuidInput} from "./shared/types";
import {toBuffer} from "./node";

export * from "./shared";

// The /node declaration supplies the native Buffer signatures for instances and the constructor.
export interface UUID extends SharedUUID {}

type UuidFactory = "parse" | "fromString" | "fromHex" | "fromBytes" | "nil" | "max" | "v4" | "v7";
type RequiredFactories = {
  [K in UuidFactory]: (...args: Parameters<(typeof SharedUUID)[K]>) => UUID;
};
interface NullableParser {
  <T extends UuidInput>(input: T): UUID;
  <T extends NullableUuidInput>(input: T): T extends null | undefined ? T : UUID;
  (input: unknown): UUID | null | undefined;
}
export interface NodeUuidConstructor extends
  Omit<typeof SharedUUID, UuidFactory | "prototype" | "from" | "tryParse" | "parseNullable">, RequiredFactories {
  new(input: unknown): UUID;
  readonly prototype: UUID;
  readonly from: NullableParser;
  parseNullable: NullableParser;
  tryParse(input: unknown): UUID | undefined;
}

function nodeConstructor(): NodeUuidConstructor {
  Object.defineProperty(SharedUUID, "toBuffer", {configurable: true, writable: true, value: toBuffer});
  Object.defineProperty(SharedUUID.prototype, "toBuffer", {
    configurable: true,
    writable: true,
    value(this: SharedUUID) { return toBuffer(this); },
  });
  return SharedUUID as NodeUuidConstructor;
}

export const UUID = nodeConstructor();
export const {parse, parseNullable, tryParse, v4, v7} = UUID;
