import type {UUID as SharedUUID} from "../shared/UUID";
import type {NullableParser} from "../shared/types/parsing.types";

// The explicit /node entry augments these types with the native Buffer signatures.
export interface NodeUuid extends SharedUUID {}

type UuidFactory = "parse" | "fromString" | "fromHex" | "fromBytes" | "nil" | "max" | "v4" | "v7";
type RequiredFactories = {
  [K in UuidFactory]: (...args: Parameters<(typeof SharedUUID)[K]>) => NodeUuid;
};

export interface NodeUuidConstructor extends
  Omit<typeof SharedUUID, UuidFactory | "prototype" | "from" | "tryParse" | "parseNullable">, RequiredFactories {
  new(input: unknown): NodeUuid;
  readonly prototype: NodeUuid;
  readonly from: NullableParser<NodeUuid>;
  parseNullable: NullableParser<NodeUuid>;
  tryParse(input: unknown): NodeUuid | undefined;
}
