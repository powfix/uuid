import {UUID as BaseUUID} from "../shared/UUID";

export class UUID extends BaseUUID {
  public toBuffer(): Buffer {
    return Buffer.from(this.bytes);
  }
}
