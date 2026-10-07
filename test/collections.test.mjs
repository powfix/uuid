import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {createRequire} from "node:module";
import {types} from "node:util";
import * as shared from "../dist/index.js";
import * as node from "../dist/index.node.js";

const require = createRequire(import.meta.url);
const first = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const second = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const third = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const invalid = ["", "not-a-uuid", "z".repeat(32), "a".repeat(36), first.replaceAll("-", "_"),
  new Uint8Array(15), new Uint8Array(17), new ArrayBuffer(16), 123, {}, []];

for (const [name, api] of [["ESM shared", shared], ["ESM node", node],
  ["CJS shared", require("../dist/index.cjs")], ["CJS node", require("../dist/index.node.cjs")]]) {
  const {UUID, UuidMap, UuidSet} = api;
  const representations = [first, first.toUpperCase(), first.replaceAll("-", ""),
    UUID.from(first), UUID.from(first).toBytes(), Buffer.from(UUID.from(first).toBytes())];

  describe(name, () => {
    it("uses actual native Map/Set storage and supports native collection consumers", () => {
      const value = {name: "first"};
      const map = new UuidMap([[first, value], [first.toUpperCase(), value], [second, undefined]]);
      const set = new UuidSet([first, first.toUpperCase(), second]);
      assert.ok(map instanceof Map);
      assert.ok(set instanceof Set);
      assert.ok(types.isMap(map));
      assert.ok(types.isSet(set));
      assert.equal(Object.prototype.toString.call(map), "[object Map]");
      assert.equal(Object.prototype.toString.call(set), "[object Set]");
      const mapSize = Object.getOwnPropertyDescriptor(Map.prototype, "size").get;
      const setSize = Object.getOwnPropertyDescriptor(Set.prototype, "size").get;
      assert.equal(mapSize.call(map), 2);
      assert.equal(setSize.call(set), 2);
      assert.deepEqual([...Map.prototype.entries.call(map)], [...map]);
      assert.deepEqual([...Set.prototype.values.call(set)], [...set]);
      assert.deepEqual(new Map(map), new Map([[first, value], [second, undefined]]));
      assert.deepEqual(new Set(set), new Set([first, second]));
      assert.equal(map.values().next().value, value);
      map.delete(first.toUpperCase());
      set.delete(UUID.from(first).toBytes());
      assert.equal(mapSize.call(map), 1);
      assert.equal(setSize.call(set), 1);
      map.clear();
      set.clear();
      assert.equal(mapSize.call(map), 0);
      assert.equal(setSize.call(set), 0);
    });

    it("makes the native structured-clone boundary explicit", () => {
      const map = new UuidMap([[first, 1]]);
      const set = new UuidSet([first]);
      const mapCopy = structuredClone(map);
      const setCopy = structuredClone(set);
      assert.ok(mapCopy instanceof Map);
      assert.ok(setCopy instanceof Set);
      assert.equal(mapCopy instanceof UuidMap, false);
      assert.equal(setCopy instanceof UuidSet, false);
      assert.equal(mapCopy.get(first), 1);
      assert.equal(setCopy.has(first), true);
      assert.equal(mapCopy.has(first.toUpperCase()), false);
      assert.equal(setCopy.has(first.toUpperCase()), false);
      const objectCopy = structuredClone(new UuidSet([UUID.from(first)]));
      const copiedKey = [...objectCopy][0];
      assert.equal(copiedKey instanceof UUID, false);
      assert.deepEqual(copiedKey.bytes, UUID.from(first).bytes);
    });

    it("initializes native subclasses with iterables before subsequent operations", () => {
      class DerivedMap extends UuidMap {}
      class DerivedSet extends UuidSet {}
      const map = new DerivedMap([[first, 1]]);
      const set = new DerivedSet([first]);
      assert.equal(map.get(first.toUpperCase()), 1);
      assert.equal(map.set(second, 2), map);
      assert.equal(set.has(UUID.from(first).toBytes()), true);
      assert.equal(set.add(second), set);
      for (const method of ["union", "intersection", "difference", "symmetricDifference"]) {
        const result = set[method](new Set([first.toUpperCase(), third]));
        assert.ok(result instanceof Set);
        assert.ok(result instanceof UuidSet);
        assert.ok(types.isSet(result));
      }
    });

    it("distinguishes UUID instance methods from explicitly borrowed native methods", () => {
      const map = new UuidMap([[first, 1]]);
      const set = new UuidSet([first]);
      assert.equal(map.get(first.toUpperCase()), 1);
      assert.equal(Map.prototype.get.call(map, first.toUpperCase()), undefined);
      assert.equal(set.has(first.toUpperCase()), true);
      assert.equal(Set.prototype.has.call(set, first.toUpperCase()), false);
      if (typeof Set.prototype.union === "function") {
        const result = Set.prototype.union.call(set, new Set([first.toUpperCase()]));
        assert.equal(result.size, 2);
        assert.equal(result instanceof UuidSet, false);
      }
    });

    it("compares every pair of representations for map and set operations", () => {
      for (const stored of representations) for (const lookup of representations) {
        const map = new UuidMap([[stored, 1], [second, 2]]);
        const set = new UuidSet([stored, second]);
        assert.equal(map.get(lookup), 1);
        assert.equal(map.has(lookup), true);
        assert.equal(set.has(lookup), true);
        assert.equal(map.set(lookup, 3), map);
        assert.equal(set.add(lookup), set);
        assert.equal(map.size, 2);
        assert.equal(set.size, 2);
        assert.equal(map.get(stored), 3);
        assert.equal(map.delete(lookup), true);
        assert.equal(set.delete(lookup), true);
        assert.equal(map.delete(lookup), false);
        assert.equal(set.delete(lookup), false);
        assert.deepEqual([...map], [[second, 2]]);
        assert.deepEqual([...set], [second]);
      }
    });

    it("preserves first string spelling, last value, insertion order and copy independence", () => {
      const map = new UuidMap([[first.toUpperCase(), 1], [second, 2], [first, undefined]]);
      const copy = new UuidMap(map);
      assert.equal(copy.has(first), true);
      assert.deepEqual([...copy], [[first.toUpperCase(), undefined], [second, 2]]);
      copy.delete(first);
      copy.set(first, 4);
      assert.deepEqual([...copy.keys()], [second, first]);
      assert.deepEqual([...copy.values()], [2, 4]);
      assert.equal(map.get(first), undefined);
      copy.clear();
      assert.equal(copy.size, 0);
      assert.equal(copy.has(first), false);
      copy.set(first, 5);
      assert.deepEqual([...copy], [[first, 5]]);
      const set = new UuidSet([first.toUpperCase(), second, first]);
      const setCopy = new UuidSet(set);
      assert.deepEqual([...setCopy], [first.toUpperCase(), second]);
      setCopy.clear();
      assert.equal(set.size, 2);
      assert.equal(setCopy.size, 0);
      setCopy.add(first);
      assert.deepEqual([...setCopy], [first]);
    });

    it("copies mutable keys on insertion and on every outward access", () => {
      for (const make of [() => UUID.from(first).toBytes(), () => Buffer.from(UUID.from(first).toBytes()), () => UUID.from(first)]) {
        const original = make();
        const map = new UuidMap([[original, {keepReference: true}]]);
        const set = new UuidSet([original]);
        const mutate = key => { (key instanceof UUID ? key.bytes : key)[0] = 0; };
        mutate(original);
        assert.equal(map.has(first), true);
        assert.equal(map.has(original), false);
        assert.equal(set.has(first), true);
        for (const key of map.keys()) mutate(key);
        for (const [key] of map.entries()) mutate(key);
        map.forEach((_, key) => mutate(key));
        for (const value of set) mutate(value);
        for (const [value, value2] of set.entries()) { assert.equal(value, value2); mutate(value); }
        set.forEach((value, value2) => { assert.equal(value, value2); mutate(value); });
        assert.equal(map.has(first), true);
        assert.equal(set.has(first), true);
        const output = [...map.keys()][0];
        assert.equal(map.has(output), true);
        assert.equal(Object.getPrototypeOf(output), Object.getPrototypeOf(original));
        assert.equal(map.get(first), [...map.values()][0]);
        if (name.endsWith("node") && output instanceof UUID) assert.equal(output.toBuffer().length, 16);
      }
    });

    it("uses current UUID bytes instead of an instance's stale string cache", () => {
      const input = UUID.from(first);
      input.toHex();
      input.toString();
      input.bytes[0] = 0;
      const current = UUID.from(input.toBytes()).toString();
      const map = new UuidMap([[input, 1]]);
      assert.equal(map.has(first), false);
      assert.equal(map.get(current), 1);
      assert.equal(map.has([...map.keys()][0]), true);
    });

    it("preserves live iteration and callback owner/thisArg semantics", () => {
      const map = new UuidMap([[first, 1], [second, 2]]);
      const iterator = map.keys();
      assert.equal(iterator.next().value, first);
      map.delete(second);
      map.set(third, 3);
      assert.equal(iterator.next().value, third);
      assert.equal(iterator.next().done, true);
      const context = {};
      const visited = [];
      map.forEach(function (value, key, owner) {
        assert.equal(this, context);
        assert.equal(owner, map);
        visited.push(key);
        if (key === first) owner.set(second, 2);
      }, context);
      assert.deepEqual(visited, [first, third, second]);
      const set = new UuidSet([first]);
      const values = [];
      set.forEach(function (value, value2, owner) {
        assert.equal(this, context);
        assert.equal(value, value2);
        assert.equal(owner, set);
        values.push(value);
        if (value === first) owner.add(second);
      }, context);
      assert.deepEqual(values, [first, second]);
      assert.throws(() => new UuidMap().forEach(null), TypeError);
      assert.throws(() => new UuidSet().forEach(null), TypeError);
    });

    it("preserves UUID semantics and receiver order across all set operations", () => {
      const a = new UuidSet([first, second]);
      const b = new Set([UUID.from(second).toBytes(), third.toUpperCase()]);
      const union = a.union(b);
      assert.ok(union instanceof UuidSet);
      assert.deepEqual([...union], [first, second, third.toUpperCase()]);
      assert.deepEqual([...a.intersection(b)], [second]);
      assert.deepEqual([...a.difference(b)], [first]);
      assert.deepEqual([...a.symmetricDifference(b)], [first, third.toUpperCase()]);
      assert.equal(a.isSubsetOf(union), true);
      assert.equal(union.isSupersetOf(a), true);
      assert.equal(a.isSupersetOf(union), false);
      assert.equal(a.isSubsetOf(b), false);
      assert.equal(a.isDisjointFrom([third]), true);
      assert.equal(a.isDisjointFrom(b), false);
      assert.deepEqual([...a.union(new Set([first.toUpperCase()]))], [first, second]);
      assert.deepEqual([...a.intersection(new Map([[first.toUpperCase(), 1]]))], [first]);
      const setLike = {size: 1, has: () => false, keys: () => [second.toUpperCase()].values()};
      assert.deepEqual([...a.intersection(setLike)], [second]);
      assert.equal(a.isSupersetOf([first, first.toUpperCase(), second, second.toUpperCase()]), true);
      assert.deepEqual([...a], [first, second]);
      const empty = new UuidSet();
      assert.equal(empty.isSubsetOf(a), true);
      assert.equal(a.isSupersetOf(empty), true);
      assert.equal(empty.isDisjointFrom(a), true);
      assert.deepEqual([...empty.intersection(a)], []);
    });

    it("handles missing lookups separately from malformed keys without corrupting state", () => {
      const map = new UuidMap([[first, 1]]);
      const set = new UuidSet([first]);
      for (const value of [null, undefined]) {
        assert.equal(map.has(value), false);
        assert.equal(map.get(value), undefined);
        assert.equal(map.delete(value), false);
        assert.equal(set.has(value), false);
        assert.equal(set.delete(value), false);
        assert.throws(() => map.set(value, 2));
        assert.throws(() => set.add(value));
      }
      for (const value of invalid) {
        assert.throws(() => map.set(value, 2));
        assert.throws(() => map.get(value));
        assert.throws(() => set.add(value));
        assert.throws(() => set.has(value));
        assert.throws(() => set.delete(value));
        assert.throws(() => new UuidMap([[value, 1]]));
        assert.throws(() => new UuidSet([value]));
        for (const method of ["union", "intersection", "difference", "symmetricDifference", "isSubsetOf", "isSupersetOf", "isDisjointFrom"]) {
          assert.throws(() => set[method]([value]));
          assert.throws(() => set[method](new Set([value])));
          assert.throws(() => set[method](null));
        }
      }
      assert.deepEqual([...map], [[first, 1]]);
      assert.deepEqual([...set], [first]);
    });

    it("accepts nil/max and parses correctly encoded 128-bit values consistently", () => {
      const values = [UUID.nil(), UUID.max(), UUID.from("0190bff8-cc00-7000-8000-000000000001")];
      const set = new UuidSet(values);
      assert.equal(set.size, 3);
      for (const value of values) assert.equal(set.has(value.toString()), true);
      assert.equal(new UuidMap(null).size, 0);
      assert.equal(new UuidSet(null).size, 0);
    });

    it("validates collection keys without changing existing UUID parsing", () => {
      for (const length of [15, 17]) {
        // The existing UUID factory remains permissive; collection keys must be 128 bits.
        const uuid = UUID.fromBytes(new Uint8Array(length));
        assert.equal(uuid.toBytes().length, length);
        assert.throws(() => new UuidMap([[uuid, 1]]));
        assert.throws(() => new UuidSet([uuid]));
      }
      assert.equal(UUID.equals(first, UUID.from(first).toBytes()), true);
      assert.equal(UUID.equals(null, null), false);
      assert.equal(UUID.from(null), null);
      assert.equal(UUID.from(undefined), undefined);
      assert.equal(UUID.v4().isValid(), true);
    });
  });
}

it("shares collection exports and UUID identity between root and node entry points", () => {
  assert.equal(shared.UuidMap, node.UuidMap);
  assert.equal(shared.UuidSet, node.UuidSet);
  const uuid = node.UUID.from(first);
  assert.equal(uuid instanceof shared.UUID, true);
  assert.equal(new shared.UuidSet([uuid]).has(first), true);
  assert.equal(typeof [...new shared.UuidSet([uuid])][0].toBuffer, "function");
});
