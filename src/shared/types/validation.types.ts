export type UuidVersion = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface UuidPolicy {
  versions?: readonly UuidVersion[];
  /** Restrict input to one of the two string encodings. */
  encoding?: "dashed" | "hex";
  /** Special values are accepted by default when no versions are specified. */
  allowNil?: boolean;
  allowMax?: boolean;
}
