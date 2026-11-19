import {UUID, UuidMap, UuidSet, toBuffer} from "@powfix/uuid/node";
import {parse, type CanonicalUuid, type UuidMap as EsmMap} from "@powfix/uuid";
import {Buffer} from "node:buffer";
import sharedCjs = require("@powfix/uuid");
import nodeCjs = require("@powfix/uuid/node");

const id = UUID.from("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
const buffer: Buffer = toBuffer(id);
const map = new UuidMap([[buffer, 1]]);
const keys: CanonicalUuid[] = [...map.keys()];
map.get(id);
const ids: CanonicalUuid[] = [...new UuidSet([buffer, id])];

const mixed: UUID = sharedCjs.parse(id);
const otherDirection: nodeCjs.UUID = parse(mixed);
const sameMap: EsmMap<number> = new nodeCjs.UuidMap<number>();
const stringFromEither: CanonicalUuid = sharedCjs.format(otherDirection);
