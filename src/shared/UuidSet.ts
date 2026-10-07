import type {NullableUuidInput, UuidInput} from "./types";
import {copyKey, uuidKey} from "./collections/key";

/** The set-like shape also accepted by native set operations (including Map keys). */
export interface UuidSetLike<T = UuidInput> {
  readonly size: number;
  has(value: T): boolean;
  keys(): Iterator<T>;
}

export type UuidSetOperand<T = UuidInput> = Iterable<T> | UuidSetLike<T>;

function operandKeys<T>(other: UuidSetOperand<T>): Iterable<T> {
  if (other == null) throw new TypeError("Expected an iterable or set-like UUID collection");
  if ((typeof other === "object" || typeof other === "function") && "size" in other && typeof other.keys === "function" && typeof other.has === "function") {
    return {[Symbol.iterator]: () => other.keys()};
  }
  return other as Iterable<T>;
}

function uuidOperand(other: UuidSetOperand<unknown>): UuidSet {
  // Every key is checked by add's UUID parser before it reaches native storage.
  return new UuidSet(operandKeys(other) as Iterable<UuidInput>);
}

/**
 * A native Set subclass with UUID-value equality and defensive key copies.
 * All set operations validate operand keys and preserve receiver order.
 * Use instance methods: borrowed native methods bypass UUID indexing and copies.
 */
export class UuidSet<K extends UuidInput = UuidInput> extends Set<K> {
  readonly #valuesByUuid = new Map<string, K>();

  constructor(values?: Iterable<K> | null) {
    // Set(iterable) would call this.add before the private index is initialized.
    super();
    if (values != null) {
      for (const value of values) this.add(value);
    }
  }

  /** Malformed UUID inputs throw without modifying the set. */
  override add(value: K): this {
    const index = uuidKey(value);
    if (!this.#valuesByUuid.has(index)) {
      const stored = copyKey(value);
      super.add(stored);
      this.#valuesByUuid.set(index, stored);
    }
    return this;
  }

  /** Nullish lookup values are absent; malformed non-nullish inputs throw. */
  override has(value: NullableUuidInput): boolean {
    return value != null && this.#valuesByUuid.has(uuidKey(value));
  }

  override delete(value: NullableUuidInput): boolean {
    if (value == null) return false;
    const index = uuidKey(value);
    const stored = this.#valuesByUuid.get(index);
    if (stored === undefined) return false;
    this.#valuesByUuid.delete(index);
    return super.delete(stored);
  }

  override clear(): void {
    super.clear();
    this.#valuesByUuid.clear();
  }

  override keys(): Generator<K, undefined, unknown> { return this.values(); }

  override *values(): Generator<K, undefined, unknown> {
    for (const value of super.values()) yield copyKey(value);
    return undefined;
  }

  override *entries(): Generator<[K, K], undefined, unknown> {
    for (const value of this.values()) yield [value, value];
    return undefined;
  }

  override [Symbol.iterator](): Generator<K, undefined, unknown> { return this.values(); }

  override forEach(callbackfn: (value: K, value2: K, set: UuidSet<K>) => void, thisArg?: unknown): void {
    if (typeof callbackfn !== "function") throw new TypeError("Expected a callback function");
    super.forEach(value => {
      const output = copyKey(value);
      callbackfn.call(thisArg, output, output, this);
    });
  }

  /** Receiver values first, then new values from the operand in its iteration order. */
  union<U extends UuidInput>(other: UuidSetOperand<U>): UuidSet<K | U>;
  /** Native Set compatibility: non-UUID operand keys still throw at runtime. */
  union<U>(other: UuidSetLike<U>): UuidSet<K | (U & UuidInput)>;
  union(other: UuidSetOperand<unknown>): UuidSet {
    const result = new UuidSet<UuidInput>(this);
    // add validates each unknown key before writing to native storage.
    for (const value of operandKeys(other)) result.add(value as UuidInput);
    return result;
  }

  /** Keep matching receiver values and their representation, even across input types. */
  intersection(other: UuidSetOperand): UuidSet<K>;
  /**
   * Native Set compatibility for operands whose element type is not known to be UUID.
   * Use UUID-typed operands and retain the UuidSet type for accurate result inference:
   * native Set's K & U result assumes identity equality, unlike UUID equality.
   */
  intersection<U>(other: UuidSetLike<U>): Set<K & U>;
  intersection(other: UuidSetOperand<unknown>): Set<unknown> {
    const matching = uuidOperand(other);
    const result = new UuidSet<K>();
    for (const value of this) if (matching.has(value)) result.add(value);
    return result;
  }

  /** Retain receiver values absent by UUID value; non-UUID operand keys throw. */
  difference<U>(other: UuidSetOperand<U>): UuidSet<K> {
    const excluded = uuidOperand(other);
    const result = new UuidSet<K>();
    for (const value of this) if (!excluded.has(value)) result.add(value);
    return result;
  }

  symmetricDifference<U extends UuidInput>(other: UuidSetOperand<U>): UuidSet<K | U>;
  /** Native Set compatibility: non-UUID operand keys still throw at runtime. */
  symmetricDifference<U>(other: UuidSetLike<U>): UuidSet<K | (U & UuidInput)>;
  symmetricDifference(other: UuidSetOperand<unknown>): UuidSet {
    const operand = uuidOperand(other);
    const result = new UuidSet();
    for (const value of this) if (!operand.has(value)) result.add(value);
    for (const value of operand) if (!this.has(value)) result.add(value);
    return result;
  }

  isSubsetOf(other: UuidSetOperand<unknown>): boolean {
    const operand = uuidOperand(other);
    if (this.size > operand.size) return false;
    for (const value of this) if (!operand.has(value)) return false;
    return true;
  }

  isSupersetOf(other: UuidSetOperand<unknown>): boolean {
    const operand = uuidOperand(other);
    if (this.size < operand.size) return false;
    for (const value of operand) if (!this.has(value)) return false;
    return true;
  }

  isDisjointFrom(other: UuidSetOperand<unknown>): boolean {
    const operand = uuidOperand(other);
    for (const value of this) if (operand.has(value)) return false;
    return true;
  }
}
