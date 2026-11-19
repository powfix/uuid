import {UUID as Portable} from "@powfix/uuid";
import {UUID as NodeUUID, parse} from "@powfix/uuid/node";
import type {Buffer} from "node:buffer";

declare const row: {uuid: NodeUUID};
const bytes: Buffer = row.uuid.toBuffer();
const parsed: Buffer = parse(Portable.nil()).toBuffer();
// @ts-expect-error browser UUIDs only expose portable byte operations
Portable.nil().toBuffer();
