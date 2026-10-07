import type {NullableUuidInput, UuidInput} from "./types";
import {copyKey, uuidKey} from "./collections/key";

/**
 * A native Map subclass indexed by UUID value, independently of representation.
 * The first inserted key's representation and insertion order are preserved.
 * Mutable keys are copied on insertion and when returned; values are not copied.
 * Use instance methods: borrowed native methods bypass UUID indexing and copies.
 */
export class UuidMap<K extends UuidInput = UuidInput, V = unknown> extends Map<K, V> {
  readonly #keysByUuid = new Map<string, K>();

  constructor(entries?: Iterable<readonly [K, V]> | null) {
    // Map(iterable) would call this.set before the private index is initialized.
    super();
    if (entries != null) {
      for (const [key, value] of entries) this.set(key, value);
    }
  }

  /** Insert or replace a value. Malformed UUID inputs leave the map unchanged. */
  override set(key: K, value: V): this {
    const index = uuidKey(key);
    const existing = this.#keysByUuid.get(index);
    if (existing !== undefined) return super.set(existing, value);
    const stored = copyKey(key);
    super.set(stored, value);
    this.#keysByUuid.set(index, stored);
    return this;
  }

  /** Nullish lookup keys are absent; malformed non-nullish inputs throw. */
  override get(key: NullableUuidInput): V | undefined {
    if (key == null) return undefined;
    const stored = this.#keysByUuid.get(uuidKey(key));
    return stored === undefined ? undefined : super.get(stored);
  }

  override has(key: NullableUuidInput): boolean {
    return key != null && this.#keysByUuid.has(uuidKey(key));
  }

  override delete(key: NullableUuidInput): boolean {
    if (key == null) return false;
    const index = uuidKey(key);
    const stored = this.#keysByUuid.get(index);
    if (stored === undefined) return false;
    this.#keysByUuid.delete(index);
    return super.delete(stored);
  }

  override clear(): void {
    super.clear();
    this.#keysByUuid.clear();
  }

  override *keys(): Generator<K, undefined, unknown> {
    for (const key of super.keys()) yield copyKey(key);
    return undefined;
  }

  override *entries(): Generator<[K, V], undefined, unknown> {
    for (const [key, value] of super.entries()) yield [copyKey(key), value];
    return undefined;
  }

  override [Symbol.iterator](): Generator<[K, V], undefined, unknown> {
    return this.entries();
  }

  override forEach(callbackfn: (value: V, key: K, map: UuidMap<K, V>) => void, thisArg?: unknown): void {
    if (typeof callbackfn !== "function") throw new TypeError("Expected a callback function");
    super.forEach((value, key) => callbackfn.call(thisArg, value, copyKey(key), this));
  }
}
