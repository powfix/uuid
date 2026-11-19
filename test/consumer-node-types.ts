import {UUID, UuidMap, UuidSet, toBuffer} from "@powfix/uuid/node";
import {type CanonicalUuid} from "@powfix/uuid";
import {Buffer} from "node:buffer";

const id = UUID.from("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
const buffer: Buffer = toBuffer(id);
const map = new UuidMap([[buffer, 1]]);
const keys: CanonicalUuid[] = [...map.keys()];
map.get(id);
const ids: CanonicalUuid[] = [...new UuidSet([buffer, id])];

import sharedCjs = require("@powfix/uuid");
import nodeCjs = require("@powfix/uuid/node");
import {parse, type UuidMap as EsmMap} from "@powfix/uuid";

const mixed: UUID = sharedCjs.parse(id);
const otherDirection: nodeCjs.UUID = parse(mixed);
const sameMap: EsmMap<number> = new nodeCjs.UuidMap<number>();
const stringFromEither: CanonicalUuid = sharedCjs.format(otherDirection);
