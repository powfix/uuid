import assert from "node:assert/strict";
import {it} from "node:test";
import {UUID, v4, v7} from "../dist/index.js";

it("lays out the RFC 9562 Appendix A.6 UUIDv7 test vector", t => {
  t.mock.method(Date, "now", () => 0x017f22e279b0);
  t.mock.method(globalThis.crypto, "getRandomValues", bytes => {
    bytes.set([0xac, 0xc3, 0xd8, 0xc4, 0xdc, 0x0c, 0x0c, 0x07, 0x39, 0x8f], 6);
    return bytes;
  });
  assert.equal(v7().toString(), "017f22e2-79b0-7cc3-98c4-dc0c0c07398f");
  assert.equal(v4().toString(), "00000000-0000-4cc3-98c4-dc0c0c07398f");
});

it("preserves all 48 timestamp bits and draws fresh entropy for each ID", t => {
  let now = 0;
  let sequence = 0;
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis.crypto, "getRandomValues", bytes => bytes.fill(++sequence));
  const first = v7();
  assert.equal(first.toHex().slice(0, 12), "000000000000");
  assert.equal(first.equals(v7()), false);
  now = 0xffffffffffff;
  const last = UUID.v7();
  assert.equal(last.toHex().slice(0, 12), "ffffffffffff");
  assert.equal(first.compare(last), -1);
  now = 1;
  assert.equal(v7().compare(last), -1);
  for (now of [-1, 0x1000000000000, NaN]) assert.throws(v7, RangeError);
});

it("requires a cryptographic randomness source for both generators", t => {
  t.mock.getter(globalThis, "crypto", () => undefined);
  assert.throws(v4, /crypto.getRandomValues/);
  assert.throws(v7, /crypto.getRandomValues/);
});
