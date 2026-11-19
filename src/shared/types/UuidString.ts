export type UuidString = `${string}-${string}-${string}-${string}-${string}`;

declare const canonical: unique symbol;

/** A validated, lowercase UUID in 8-4-4-4-12 notation. */
export type CanonicalUuid = UuidString & {readonly [canonical]: true};
