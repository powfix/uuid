import {UUID, UuidMap, UuidSet} from "@powfix/uuid/node";
import {UuidMap as SharedUuidMap} from "@powfix/uuid";
import {Buffer} from "node:buffer";

const id = UUID.from("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
const map = new UuidMap([[id, 1]]);
const sharedMap = new SharedUuidMap([[id, 1]]);
for (const [key] of map) { const buffer: Buffer = key.toBuffer(); }
for (const [key] of sharedMap) key.toBuffer();
for (const key of new UuidSet([id])) key.toBuffer();
const bufferKeys = new UuidSet([id.toBuffer()]);
for (const key of bufferKeys) key.readUInt32BE();
map.get(id.toBuffer());
