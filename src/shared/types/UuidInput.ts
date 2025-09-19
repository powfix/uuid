import {UUID} from "../UUID";
import {UuidString} from "./UuidString";

export type UuidInput = string | UuidString | ArrayBufferView | UUID;
export type NullableUuidInput = UuidInput | null | undefined;
export type NonNullableUuidInput = NonNullable<NullableUuidInput>;
