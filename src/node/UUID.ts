import {UUID as BaseUUID} from "../UUID";

export class UUID extends BaseUUID {
  public toBuffer(): Buffer {
    return Buffer.from(this.bytes);
  }
}
