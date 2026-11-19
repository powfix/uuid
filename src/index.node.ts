import type {Buffer} from "node:buffer";

export * from "./index.runtime-node";
export * from "./node";

declare module "./index.runtime-node.js" {
  interface UUID {
    /** Return an independent 16-byte Node Buffer in network byte order. */
    toBuffer(): Buffer;
  }
}
