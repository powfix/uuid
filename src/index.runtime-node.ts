import {UUID as SharedUUID} from "./shared/UUID";
import type {NodeUuid, NodeUuidConstructor} from "./node/uuid.types";
import {toBuffer} from "./node";

export * from "./shared";

export type {NodeUuidConstructor} from "./node/uuid.types";
export type UUID = NodeUuid;

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
