import {readUuid} from "../encoding";
import {MAX_UUID, NIL_UUID} from "../constants";
import type {UuidInput, UuidPolicy, UuidVersion} from "../types";

export function isRfcUuid(input: unknown, policy: UuidPolicy = {}): input is UuidInput {
  if (policy.encoding !== undefined) {
    const length = policy.encoding === "dashed" ? 36 : 32;
    if (typeof input !== "string" || input.length !== length) return false;
  }
  const value = readUuid(input);
  if (value === undefined) return false;
  if (value === NIL_UUID) return policy.allowNil ?? (policy.versions === undefined);
  if (value === MAX_UUID) return policy.allowMax ?? (policy.versions === undefined);
  const version = Number.parseInt(value[14], 16);
  return version >= 1 && version <= 8 && "89ab".includes(value[19]) &&
    (policy.versions === undefined || policy.versions.includes(version as UuidVersion));
}
