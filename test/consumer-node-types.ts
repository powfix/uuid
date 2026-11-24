import {
  UUID, UuidMap, UuidSet, from, fromBytes, fromHex, fromString, max, nil, parseNullable, parseUuid, tryParse, v4, v7, toBuffer,
} from "@powfix/uuid/node";
import {parse, type CanonicalUuid, type UuidMap as EsmMap} from "@powfix/uuid";
import {Buffer} from "node:buffer";
import sharedCjs = require("@powfix/uuid");
import nodeCjs = require("@powfix/uuid/node");
import type {NodeUuidConstructor} from "@powfix/uuid/node";

const id = UUID.from("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
const buffer: Buffer = toBuffer(id);
const factory: NodeUuidConstructor = UUID;
const factoryBytes: Buffer = factory.parse(id).toBuffer();
const convert: typeof toBuffer = UUID.toBuffer;
const staticBuffer: Buffer = convert(id.toString());
const cjsBuffer: Buffer = nodeCjs.UUID.toBuffer(id.toBytes());
// @ts-expect-error a UUID input is required
UUID.toBuffer(null);
const model: {uuid: UUID} = {uuid: id};
const fromModel: Buffer = model.uuid.toBuffer();
declare const optionalBuffer: Buffer | null;
const nullableModel: UUID | null = parseNullable(optionalBuffer);
const nullableBytes: Buffer | undefined = nullableModel?.toBuffer();
const validated: Buffer | undefined = tryParse(buffer)?.toBuffer();
const namedFactories: Buffer[] = [
  from(id).toBuffer(), fromBytes(buffer).toBuffer(), fromHex(id.toHex()).toBuffer(), fromString(id.toString()).toBuffer(),
  nil().toBuffer(), max().toBuffer(), parseUuid(id).toBuffer(), nodeCjs.parseUuid(id).toBuffer(),
];
const fromOptional: Buffer | undefined = from(optionalBuffer)?.toBuffer();
const copies: Buffer[] = [
  new UUID(buffer).toBuffer(), UUID.fromString(id.toString()).toBuffer(), UUID.fromHex(id.toHex()).toBuffer(),
  UUID.fromBytes(buffer).toBuffer(), UUID.nil().toBuffer(), UUID.max().toBuffer(), v4().toBuffer(), v7().toBuffer(),
];
const empty: null = UUID.from(null);
const missing: undefined = parseNullable(undefined);
// Legacy form sanitizers receive an unchecked value from their middleware.
declare const formValue: any;
const sanitized = UUID.from(formValue).toBuffer();
const namedSanitized: Buffer = from(formValue).toBuffer();
// @ts-expect-error the sanitizer returns a typed Buffer
sanitized.unknownBufferMethod();
const map = new UuidMap([[buffer, 1]]);
const keys: CanonicalUuid[] = [...map.keys()];
map.get(id);
const ids: CanonicalUuid[] = [...new UuidSet([buffer, id])];

const mixed: UUID = sharedCjs.parse(id);
const otherDirection: nodeCjs.UUID = parse(mixed);
const mixedBuffer: Buffer = otherDirection.toBuffer();
const sameMap: EsmMap<number> = new nodeCjs.UuidMap<number>();
const stringFromEither: CanonicalUuid = sharedCjs.format(otherDirection);
