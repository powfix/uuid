import {UUID} from "../UUID";
import {isLocalUuid} from "../encoding";

/** Parse any supported UUID representation. Malformed and nullish inputs throw TypeError. */
export function parseUuid(input: unknown): UUID {
  return isLocalUuid(input) ? input : new UUID(input);
}
