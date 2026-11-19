import {
  UUID, UuidMap, UuidSet, isRfcUuid, parse, parseNullable, tryParse,
  type CanonicalUuid, type NullableUuidInput, type UuidInput, type UuidSetLike,
} from "@powfix/uuid";

const id: string = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bytes = UUID.from(id).toBytes();
const map = new UuidMap<number>([[id, 1]]);
const value: number | undefined = map.get(bytes);
map.set(bytes, 3).set(UUID.from(id), 4);
map.get(null);
map.delete(undefined);
const inferred = new UuidMap([[bytes, 1]] as const);
const inferredValue: number | undefined = inferred.get(id);
const iterable: Iterable<[CanonicalUuid, number]> = map;
const native = new Map(map);
const strings: CanonicalUuid[] = [...map.keys()];
const computed: number = map.getOrInsertComputed(id, key => key.length);
const set = new UuidSet([id, bytes]);
const nativeSet: Set<CanonicalUuid> = new Set(set);
const other: UuidSetLike<Uint8Array> = new Map([[bytes, 1]]);
const intersection: UuidSet = set.intersection(other);
const union: UuidSet = set.union(new Set([bytes]));
const difference: UuidSet = set.difference([bytes]);
set.symmetricDifference([id]).has(bytes);
set.isSubsetOf(map);
set.isSupersetOf(set);
set.isDisjointFrom([UUID.from(id)]);
// @ts-expect-error numeric keys are not UUID inputs
map.set(123, 1);
// @ts-expect-error inserted values must match the inferred value type
map.set(bytes, "wrong");
// @ts-expect-error numbers are not valid UUID set operands
set.union(new Set([1]));

declare const externalInput: unknown;
declare const maybeInput: NullableUuidInput;
const parsed: UUID = parse(externalInput);
const opt: UUID | undefined = tryParse(externalInput);
const maybe: UUID | null | undefined = parseNullable(maybeInput);
const optionalNull: null = UUID.from(null);
const optionalUndefined: undefined = parseNullable(undefined);
const canonical: CanonicalUuid = parsed.toString();
if (isRfcUuid(externalInput, {versions: [4, 7]})) {
  const supported: UuidInput = externalInput;
  map.get(supported);
}
const olderValue: UuidInput = {toBytes: () => bytes};
map.get(olderValue);
