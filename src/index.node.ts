import type {Buffer} from "node:buffer";
import type {toBuffer} from "./node";

export * from "./index.runtime-node";
export * from "./node";

declare module "./index.runtime-node.js" {
  interface NodeUuidConstructor {
    /** The standalone toBuffer converter, available directly on the class. */
    toBuffer: typeof toBuffer;
  }
  interface UUID {
    /** Return an independent 16-byte Node Buffer in network byte order. */
    toBuffer(): Buffer;
  }
}
