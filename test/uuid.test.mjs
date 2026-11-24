import assert from "node:assert/strict";
import {it} from "node:test";
import {createRequire} from "node:module";
import {runInNewContext} from "node:vm";
import {UUID, UuidMap, Uint8ArrayUtils, format, isRfcUuid, isUuidEncoding, parse, parseNullable, parseUuid, tryParse} from "../dist/index.js";
import * as node from "../dist/index.node.js";

const {UUID: NodeUUID, toBuffer} = node;

const id = "00112233-4455-4677-8899-aabbccddeeff";
const hex = "00112233445546778899aabbccddeeff";
const bytes = Uint8Array.of(0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x46, 0x77,
  0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff);

it("shares the strict parser and recognizes genuine local UUIDs by their stored value", () => {
  assert.equal(parseUuid, parse);
  assert.equal(parseUuid, UUID.parse);
  const local = parseUuid(hex);
  local.toBytes = () => { throw new Error("local UUIDs already carry their canonical value"); };
  assert.equal(parseUuid(local), local);
  assert.equal(format(local), id);
  assert.equal(parseUuid({toBytes: () => bytes}).toString(), id);
  assert.throws(() => parseUuid(Object.create(UUID.prototype)), TypeError);
  for (const invalid of ["bad", null, undefined]) {
    assert.throws(() => parseUuid(invalid), TypeError);
    assert.equal(tryParse(invalid)?.toHex(), undefined);
  }
});

it("parses every representation with one API and preserves all bits and offsets", () => {
  const padded = Uint8Array.of(255, ...bytes, 255);
  for (const input of [id, id.toUpperCase(), hex.toUpperCase(), bytes, padded.subarray(1, 17),
    Buffer.from(padded).subarray(1, 17), parse(id), {toBytes: () => bytes},
    Object.assign(() => {}, {toBytes: () => bytes})]) {
    assert.equal(format(input), id);
    assert.equal(tryParse(input).toHex(), hex);
    assert.equal(isUuidEncoding(input), true);
    assert.equal(new UUID(input).toString(), id);
    assert.deepEqual(parse(input).toBytes(), bytes);
    assert.deepEqual(toBuffer(input), Buffer.from(bytes));
  }
  const model = parse(id);
  assert.equal(parse(model), model);
  assert.equal(NodeUUID, UUID);
  assert.equal(UUID.fromHex(hex).toString(), id);
  assert.equal(UUID.fromString(id).toString(), id);
  assert.equal(UUID.fromBytes(bytes).toString(), id);
  assert.throws(() => UUID.fromHex(id), TypeError);
  assert.throws(() => UUID.fromString(bytes), TypeError);
  assert.throws(() => UUID.fromBytes(hex), TypeError);
});

it("keeps throwing, optional and null-preserving parsing distinct", () => {
  for (const value of [null, undefined]) {
    assert.equal(tryParse(value), undefined);
    assert.throws(() => parse(value), TypeError);
    assert.equal(parseNullable(value), value);
    assert.equal(UUID.from(value), value);
  }
  assert.equal(parseNullable(hex).toString(), id);
  const invalid = ["", id + "\n", hex + " ", id.replace("-", "") + "-", "1g".repeat(16), "gg".repeat(16),
    "{"+id+"}", "urn:uuid:"+id, new Uint8Array(0), new Uint8Array(15), new Uint8Array(17),
    new Int8Array(16), new Uint8ClampedArray(16), new Uint16Array(8), new DataView(bytes.buffer),
    bytes.buffer, [...bytes], 42, {}, {toBytes: () => id}, {toBytes: () => new Uint8Array(15)},
    {get toBytes() { throw new Error("unavailable"); }}];
  for (const value of invalid) {
    assert.equal(tryParse(value), undefined);
    assert.equal(isUuidEncoding(value), false);
    for (const read of [parse, parseNullable, UUID.from, format, toBuffer]) assert.throws(() => read(value), TypeError);
  }
});

it("compares complete values in unsigned network byte order", () => {
  const values = [UUID.nil(), parse(id), UUID.max()];
  for (const [i, a] of values.entries()) for (const [j, b] of values.entries()) {
    assert.equal(a.compare(b.toBytes()), Math.sign(i - j));
    assert.equal(UUID.equals(a, b), i === j);
  }
  assert.equal(UUID.equals(id, bytes, hex), true);
  assert.equal(UUID.equals(id, bytes, UUID.max()), false);
  assert.equal(UUID.equals(null, null), false);
  assert.throws(() => UUID.equals(id), TypeError);
  for (const wrong of [new Uint8Array(1), new Uint8Array(17), "gg".repeat(16)]) {
    assert.throws(() => UUID.equals(UUID.nil(), wrong), TypeError);
    assert.throws(() => UUID.compare(wrong, UUID.nil()), TypeError);
  }
});

it("keeps JSON, comparisons and database bytes in sync after every outward mutation", () => {
  const source = Buffer.from(bytes);
  const uuid = parse(source);
  source.fill(0);
  uuid.bytes.fill(0);
  uuid.toBytes().fill(0);
  toBuffer(uuid).fill(0);
  assert.equal(uuid.equals(id), true);
  assert.equal(uuid.toHex(), hex);
  assert.equal(JSON.stringify({id: uuid}), JSON.stringify({id}));
  assert.deepEqual(toBuffer(uuid), Buffer.from(bytes));
});

it("returns independent Node Buffers from existing instance calls and the standalone helper", () => {
  const source = Buffer.from([255, ...bytes, 255]).subarray(1, 17);
  const expected = Buffer.from(bytes);
  const model = {uuid: NodeUUID.from(source)};
  source.fill(0);
  for (const value of [
    model.uuid, new NodeUUID(hex), NodeUUID.fromString(id), NodeUUID.fromHex(hex), NodeUUID.fromBytes(bytes),
    node.parse(bytes), node.tryParse(id), node.parseNullable(hex),
  ]) {
    const first = value.toBuffer();
    const second = toBuffer(value);
    assert.ok(Buffer.isBuffer(first));
    assert.deepEqual(first, expected);
    assert.deepEqual(second, expected);
    first.fill(0);
    assert.deepEqual(second, expected);
    second.fill(255);
    assert.deepEqual(value.toBuffer(), expected);
    assert.equal(value.toString(), id);
  }
  for (const value of [NodeUUID.nil(), NodeUUID.max(), NodeUUID.v4(), node.v4(), NodeUUID.v7(), node.v7()]) {
    assert.deepEqual(value.toBuffer(), Buffer.from(value.toBytes()));
    assert.deepEqual(toBuffer(value), value.toBuffer());
  }
});

it("exposes the Node buffer converter directly on the UUID class", () => {
  const convert = NodeUUID.toBuffer;
  assert.equal(convert, toBuffer);
  const padded = Buffer.from([255, ...bytes, 255]);
  const original = NodeUUID.parse(id);
  for (const input of [id, hex.toUpperCase(), bytes, padded.subarray(1, 17), original, {toBytes: () => bytes}]) {
    const result = convert(input);
    assert.ok(Buffer.isBuffer(result));
    assert.deepEqual(result, Buffer.from(bytes));
    result.fill(0);
    assert.deepEqual(convert(input), original.toBuffer());
  }
  for (const invalid of ["bad", Buffer.alloc(15), null, undefined]) {
    assert.throws(() => convert(invalid), TypeError);
  }
});

it("accepts byte sources from another module copy and genuine uint8 views from a different realm", () => {
  const {UUID: OtherUUID} = createRequire(import.meta.url)("../dist/index.cjs");
  const other = OtherUUID.parse(id);
  const foreignBytes = runInNewContext("Uint8Array.from(data)", {data: [...bytes]});
  assert.equal(UUID.isValidBytes(foreignBytes), true);
  assert.deepEqual(parse(foreignBytes).toBytes(), bytes);
  assert.equal(parse(other).toString(), id);
  assert.equal(new UuidMap([[other, 1]]).get(foreignBytes), 1);
  const spoofed = Object.defineProperty(new Int8Array(16), Symbol.toStringTag, {value: "Uint8Array"});
  assert.equal(tryParse(spoofed), undefined);
});

it("separates all 128-bit encodings, RFC 9562 policy and historical validators", () => {
  for (let v = 1; v <= 8; v++) {
    const text = id.replace("-4677", "-" + v + "677");
    assert.equal(parse(text).version(), v);
    assert.equal(isRfcUuid(text), true);
    assert.equal(isRfcUuid(text, {versions: [4]}), v === 4);
    assert.equal(UUID.isValid(text), v <= 5);
  }
  for (const text of [id.replace("-8899", "-7899"), id.replace("-4677", "-9677")]) {
    assert.equal(UUID.parse(text).toString(), text);
    assert.equal(isRfcUuid(text), false);
  }
  for (const special of [UUID.nil(), UUID.max()]) {
    assert.equal(isRfcUuid(special), true);
    assert.equal(isRfcUuid(special, {versions: [4]}), false);
    assert.equal(UUID.isValid(special), false);
  }
  assert.equal(isRfcUuid(UUID.nil(), {versions: [4], allowNil: true}), true);
  assert.equal(isRfcUuid(UUID.max(), {allowMax: false}), false);
  assert.equal(isRfcUuid(hex, {encoding: "dashed"}), false);
  assert.equal(isRfcUuid(id, {encoding: "hex"}), false);
  assert.equal(isRfcUuid(bytes, {encoding: "hex"}), false);
  assert.equal(isRfcUuid(hex, {encoding: "hex", versions: [4]}), true);
  assert.equal(UUID.isValidString(hex), false);
  assert.equal(UUID.isValidHex(id), false);
  assert.equal(UUID.isValidBytes(id), false);
  assert.equal(UUID.v4().version(), 4);
});

it("round-trips opaque ObjectId padding and general byte strings", () => {
  const oid = Uint8Array.from({length: 12}, (_, i) => 16 + i);
  for (const offset of [0, 4]) {
    const padded = new Uint8Array(16);
    padded.set(oid, offset);
    assert.equal(isRfcUuid(padded), false);
    assert.deepEqual(parse(padded).toBytes().slice(offset, offset + 12), oid);
  }
  const all = Uint8Array.from({length: 256}, (_, byte) => byte);
  assert.deepEqual(Uint8ArrayUtils.fromHex(Uint8ArrayUtils.toHex(all).toUpperCase()), all);
  assert.deepEqual(Uint8ArrayUtils.fromHex(""), new Uint8Array());
  for (const s of ["a", "0g", "zz", "ab\n\n"]) assert.throws(() => Uint8ArrayUtils.fromHex(s), TypeError);
});
