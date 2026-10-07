import {UUID, type UuidInput, UuidMap, UuidSet, type UuidSetLike} from "@powfix/uuid";

const id: string = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bytes = UUID.from(id).toBytes();
const map = new UuidMap<string, number>([[id, 1]]);
const value: number | undefined = map.get(bytes);
map.get(UUID.from(id));
map.has(null);
map.delete(undefined);
const inferred = new UuidMap([[id, 1]] as const);
const inferredValue: number | undefined = inferred.get(bytes);
const wide = new UuidMap<UuidInput, number>();
wide.set(bytes, 1).set(UUID.from(id), 2);
const copied = new UuidMap(map);
const native = new Map(map);
const mapIterable: Iterable<[string, number]> = map;
const set = new UuidSet<string>([id]);
const mixed: UuidSet<string | Uint8Array> = set.union(new Set([bytes]));
const shared: UuidSet<string> = set.intersection(new Set([bytes]));
const difference: UuidSet<string> = set.difference([bytes]);
set.symmetricDifference([bytes]).has(id);
set.isSubsetOf(new Map([[bytes, 1]]));
set.isSupersetOf([bytes]);
set.isDisjointFrom(new UuidSet([UUID.from(id)]));
const setLike: UuidSetLike<Uint8Array> = new Map([[bytes, 1]]);
set.intersection(setLike);
const nativeSet = new Set(set);
// @ts-expect-error numeric IDs are not UUID inputs
map.get(123);
// @ts-expect-error insertion respects the declared key type
map.set(bytes, 1);
// @ts-expect-error map value type is preserved
map.set(id, "wrong");
// Native-compatible set-like signatures also accept unknown element types.
// Non-UUID elements are rejected at runtime.
const unknownKeys: UuidSetLike<unknown> = new Set<unknown>([bytes]);
const validatedUnion: UuidSet<UuidInput> = set.union(unknownKeys);
// @ts-expect-error unknown keys may contain byte or UUID objects, not only strings
const narrowedUnknownUnion: UuidSet<string> = set.union(unknownKeys);
const validatedSymmetric: UuidSet<UuidInput> = set.symmetricDifference(unknownKeys);
// @ts-expect-error unknown keys must not incorrectly narrow the result to strings
const narrowedUnknownSymmetric: UuidSet<string> = set.symmetricDifference(unknownKeys);
// @ts-expect-error cross-representation intersection preserves receiver strings
const incorrect: UuidSet<Uint8Array> = shared;

// Native assignability is checked with both ES2020 and ESNext library definitions.
const nativeMapReference: Map<string, number> = map;
const readonlyMapReference: ReadonlyMap<string, number> = map;
const nativeSetReference: Set<string> = set;
const readonlySetReference: ReadonlySet<string> = set;
const nativeUnionResult: Set<string | Uint8Array> = mixed;
const nativeIntersectionResult: Set<string> = shared;
const nativeMapCallback = (value: number, key: string, owner: Map<string, number>) => {};
const nativeSetCallback = (value: string, key: string, owner: Set<string>) => {};
map.forEach(nativeMapCallback);
set.forEach(nativeSetCallback);
class DerivedMap extends UuidMap<string, number> {}
class DerivedSet extends UuidSet<string> {}
const derivedMap: Map<string, number> = new DerivedMap([[id, 1]]);
const derivedSet: Set<string> = new DerivedSet([id]);
