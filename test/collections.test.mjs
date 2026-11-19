import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {describe, it} from "node:test";
import * as shared from "../dist/index.js";
import * as node from "../dist/index.node.js";

const require = createRequire(import.meta.url);
const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const c = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

for (const [name, api] of [
  ["ESM", shared], ["ESM node", node],
  ["CJS", require("../dist/index.cjs")], ["CJS node", require("../dist/index.node.cjs")],
]) {
  const {UUID, UuidMap, UuidSet} = api;
  const bytes = UUID.from(a).toBytes();
  const inputs = [a, a.toUpperCase(), a.replaceAll("-", ""), bytes, Buffer.from(bytes), UUID.from(a)];
  describe(name + " UUID collections", () => {
    it("uses one canonical key for all representations and retains insertion order", () => {
      for (const first of inputs) {
        const value = {};
        const map = new UuidMap([[first, 1], [b, 2]]);
        const set = new UuidSet([first, b]);
        for (const key of inputs) {
          assert.equal(map.set(key, value), map);
          assert.equal(map.get(key), value);
          assert.equal(map.has(key), true);
          assert.equal(set.add(key), set);
          assert.equal(set.has(key), true);
        }
        assert.deepEqual([...map.keys()], [a, b]);
        assert.deepEqual([...map.values()], [value, 2]);
        assert.deepEqual([...set.entries()], [[a, a], [b, b]]);
        assert.deepEqual([...new Map(map)], [[a, value], [b, 2]]);
        assert.deepEqual([...new Set(set)], [a, b]);
        assert.equal(map.delete(bytes), true);
        assert.equal(set.delete(bytes), true);
        map.set(a, 3);
        set.add(a);
        assert.deepEqual([...map.keys()], [b, a]);
        assert.deepEqual([...set], [b, a]);
        map.clear();
        set.clear();
        assert.equal(map.size, 0);
        assert.equal(set.size, 0);
      }
    });

    it("owns its keys, keeps values by reference and can be copied independently", () => {
      const buffer = Buffer.from(bytes);
      const value = {};
      const map = new UuidMap([[buffer, value]]);
      const set = new UuidSet([buffer]);
      const copy = new UuidMap(map);
      const setCopy = new UuidSet(set);
      buffer.fill(0);
      assert.equal(map.get(a), value);
      assert.equal(set.has(a), true);
      assert.equal(set.has(buffer), false);
      map.delete(a);
      set.clear();
      assert.equal(copy.get(a), value);
      assert.deepEqual([...setCopy], [a]);
      assert.throws(() => Map.prototype.set.call(copy, a, 4), TypeError);
      assert.throws(() => Set.prototype.add.call(setCopy, a), TypeError);
    });

    it("inserts default and computed values exactly once per UUID", () => {
      const map = new UuidMap([[a, undefined]]);
      const unexpected = () => { throw new Error("callback ran for an existing key"); };
      assert.equal(map.getOrInsert(bytes, "other"), undefined);
      assert.equal(map.getOrInsertComputed(bytes, unexpected), undefined);
      assert.equal(map.getOrInsert(b.toUpperCase(), 2), 2);
      assert.equal(map.getOrInsertComputed(c.toUpperCase(), key => {
        assert.equal(key, c);
        map.set(c, "temporary");
        return 3;
      }), 3);
      assert.deepEqual([...map], [[a, undefined], [b, 2], [c, 3]]);
      map.clear();
      assert.throws(() => map.getOrInsertComputed(a, unexpected), /callback ran/);
      assert.throws(() => map.getOrInsertComputed(a, null), TypeError);
      assert.equal(map.size, 0);
      const inserted = map.getOrInsertComputed(a, () => {
        map.set(b, 2);
        return 1;
      });
      assert.equal(inserted, 1);
      assert.deepEqual([...map], [[b, 2], [a, 1]]);
    });

    it("exposes live iterators and native-style forEach callbacks", () => {
      const map = new UuidMap([[a, 1], [b, 2]]);
      const iterator = map.keys();
      assert.equal(iterator.next().value, a);
      map.delete(b);
      map.set(c, 3);
      assert.equal(iterator.next().value, c);
      assert.equal(iterator.next().done, true);
      const receiver = {};
      const visited = [];
      map.forEach(function (value, key, owner) {
        assert.equal(owner, map);
        assert.equal(this, receiver);
        assert.equal(owner.get(key), value);
        visited.push(key);
        if (key === a) map.set(b, 2);
      }, receiver);
      assert.deepEqual(visited, [a, c, b]);
      const set = new UuidSet([a]);
      const seen = [];
      set.forEach(function (value, key, owner) {
        assert.equal(value, key);
        assert.equal(owner, set);
        assert.equal(this, receiver);
        seen.push(key);
        if (key === a) set.add(b);
      }, receiver);
      assert.deepEqual(seen, [a, b]);
      assert.throws(() => new UuidMap().forEach(null), TypeError);
      assert.throws(() => new UuidSet().forEach(null), TypeError);
    });

    it("performs set algebra with canonical receiver order for iterable and set-like operands", () => {
      const set = new UuidSet([a, b]);
      const other = new Map([[UUID.from(b).toBytes(), 1], [c.toUpperCase(), 2]]);
      assert.deepEqual([...set.union(other)], [a, b, c]);
      assert.deepEqual([...set.intersection(other)], [b]);
      assert.deepEqual([...set.difference(other)], [a]);
      assert.deepEqual([...set.symmetricDifference(other)], [a, c]);
      assert.equal(set.isSubsetOf(set.union(other)), true);
      assert.equal(set.isSupersetOf(other), false);
      assert.equal(set.isSupersetOf([a, a.toUpperCase(), b]), true);
      assert.equal(set.isDisjointFrom([c]), true);
      assert.equal(set.isDisjointFrom(other), false);
      const setLike = {size: 1, has: () => false, keys: () => [b.toUpperCase()].values()};
      assert.deepEqual([...set.intersection(setLike)], [b]);
      assert.deepEqual([...set], [a, b]);
    });

    it("rejects malformed inputs and treats nullish lookup keys as absent", () => {
      const map = new UuidMap([[a, 1]]);
      const set = new UuidSet([a]);
      for (const key of [null, undefined]) {
        assert.equal(map.get(key), undefined);
        for (const col of [map, set]) {
          assert.equal(col.has(key), false);
          assert.equal(col.delete(key), false);
        }
        assert.throws(() => map.set(key, 2), TypeError);
        assert.throws(() => set.add(key), TypeError);
      }
      for (const key of ["", "z".repeat(32), a.replaceAll("-", "_"), new Uint8Array(15), new Uint8Array(17), {}, 123]) {
        for (const op of [() => map.get(key), () => map.set(key, 2), () => map.getOrInsert(key, 3),
          () => map.getOrInsertComputed(key, () => 3), () => set.add(key), () => set.has(key),
          () => new UuidMap([[key, 1]]), () => new UuidSet([key])]) assert.throws(op, TypeError);
        for (const op of ["union", "intersection", "difference", "symmetricDifference", "isSubsetOf", "isSupersetOf", "isDisjointFrom"]) {
          assert.throws(() => set[op]([a, key]), TypeError);
          assert.throws(() => set[op](null), TypeError);
        }
      }
      assert.deepEqual([...map], [[a, 1]]);
      assert.deepEqual([...set], [a]);
      assert.deepEqual([...new UuidSet([UUID.nil(), UUID.max()])], [UUID.nil().toString(), UUID.max().toString()]);
    });
  });
}
