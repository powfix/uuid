import {format} from "./UUID";
import type {CanonicalUuid, NullableUuidInput, UuidInput} from "./types";

export interface UuidSetLike<T = UuidInput> {
  readonly size: number;
  has(value: T): boolean;
  keys(): Iterator<T>;
}

export type UuidSetOperand = Iterable<UuidInput> | UuidSetLike;

function operandKeys(other: UuidSetOperand): Iterable<UuidInput> {
  if (other == null) throw new TypeError("Expected an iterable or set-like UUID collection");
  const setLike = other as UuidSetLike;
  if (typeof setLike.size === "number" && typeof setLike.has === "function" && typeof setLike.keys === "function") {
    return {[Symbol.iterator]: () => setLike.keys()};
  }
  return other as Iterable<UuidInput>;
}

function normalizedOperand(other: UuidSetOperand): UuidSet {
  return new UuidSet(operandKeys(other));
}

/** A set of canonical UUID strings with value equality across input representations. */
export class UuidSet implements Iterable<CanonicalUuid> {
  readonly #values = new Set<CanonicalUuid>();

  constructor(values?: Iterable<UuidInput> | null) {
    if (values != null) for (const value of values) this.add(value);
  }

  get size(): number { return this.#values.size; }

  add(value: UuidInput): this {
    this.#values.add(format(value));
    return this;
  }

  has(value: NullableUuidInput): boolean {
    return value != null && this.#values.has(format(value));
  }

  delete(value: NullableUuidInput): boolean {
    return value != null && this.#values.delete(format(value));
  }

  clear(): void { this.#values.clear(); }
  keys(): IterableIterator<CanonicalUuid> { return this.#values.keys(); }
  values(): IterableIterator<CanonicalUuid> { return this.#values.values(); }
  entries(): IterableIterator<[CanonicalUuid, CanonicalUuid]> { return this.#values.entries(); }
  [Symbol.iterator](): IterableIterator<CanonicalUuid> { return this.values(); }

  forEach(callback: (value: CanonicalUuid, key: CanonicalUuid, set: this) => void, thisArg?: unknown): void {
    if (typeof callback !== "function") throw new TypeError("Expected a callback function");
    this.#values.forEach(value => callback.call(thisArg, value, value, this));
  }

  union(other: UuidSetOperand): UuidSet {
    const result = new UuidSet(this);
    for (const value of operandKeys(other)) result.add(value);
    return result;
  }

  intersection(other: UuidSetOperand): UuidSet {
    const operand = normalizedOperand(other);
    const result = new UuidSet();
    for (const key of this) if (operand.#values.has(key)) result.#values.add(key);
    return result;
  }

  difference(other: UuidSetOperand): UuidSet {
    const operand = normalizedOperand(other);
    const result = new UuidSet();
    for (const key of this) if (!operand.#values.has(key)) result.#values.add(key);
    return result;
  }

  symmetricDifference(other: UuidSetOperand): UuidSet {
    const operand = normalizedOperand(other);
    const result = new UuidSet();
    for (const key of this) if (!operand.#values.has(key)) result.#values.add(key);
    for (const key of operand) if (!this.#values.has(key)) result.#values.add(key);
    return result;
  }

  isSubsetOf(other: UuidSetOperand): boolean {
    const operand = normalizedOperand(other);
    if (this.size > operand.size) return false;
    for (const key of this) if (!operand.#values.has(key)) return false;
    return true;
  }

  isSupersetOf(other: UuidSetOperand): boolean {
    const operand = normalizedOperand(other);
    if (this.size < operand.size) return false;
    for (const key of operand) if (!this.#values.has(key)) return false;
    return true;
  }

  isDisjointFrom(other: UuidSetOperand): boolean {
    const operand = normalizedOperand(other);
    for (const key of this) if (operand.#values.has(key)) return false;
    return true;
  }
}
