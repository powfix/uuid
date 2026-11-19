import {UUID as SharedUUID} from "./shared/UUID";
import type {NullableUuidInput, UuidInput} from "./shared/types";
import {toBuffer} from "./node";

export * from "./shared";

// The /node declaration adds the Buffer return type to this Node-only interface.
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
type NodeConstructor = Omit<typeof SharedUUID, UuidFactory | "prototype" | "from" | "tryParse" | "parseNullable"> &
  RequiredFactories & {
    new(input: unknown): UUID;
    readonly prototype: UUID;
    readonly from: NullableParser;
    parseNullable: NullableParser;
    tryParse(input: unknown): UUID | undefined;
  };

function nodeConstructor(): NodeConstructor {
  Object.defineProperty(SharedUUID.prototype, "toBuffer", {
    configurable: true,
    writable: true,
    value(this: SharedUUID) { return toBuffer(this); },
  });
  return SharedUUID as NodeConstructor;
}

export const UUID = nodeConstructor();
export const {parse, parseNullable, tryParse, v4, v7} = UUID;
