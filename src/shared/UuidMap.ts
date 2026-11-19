import {formatUuid} from "./encoding";
import type {CanonicalUuid, NullableUuidInput, UuidInput} from "./types";

/** A value-keyed map. Iteration always returns lowercase, dashed UUID strings. */
export class UuidMap<V = unknown> implements Iterable<[CanonicalUuid, V]> {
  readonly #entries = new Map<CanonicalUuid, V>();

  constructor(entries?: Iterable<readonly [UuidInput, V]> | null) {
    if (entries != null) for (const [key, value] of entries) this.set(key, value);
  }

  get size(): number { return this.#entries.size; }

  set(key: UuidInput, value: V): this {
    this.#entries.set(formatUuid(key), value);
    return this;
  }

  get(key: NullableUuidInput): V | undefined {
    return key == null ? undefined : this.#entries.get(formatUuid(key));
  }

  has(key: NullableUuidInput): boolean {
    return key != null && this.#entries.has(formatUuid(key));
  }

  delete(key: NullableUuidInput): boolean {
    return key != null && this.#entries.delete(formatUuid(key));
  }

  clear(): void { this.#entries.clear(); }

  getOrInsert(key: UuidInput, defaultValue: V): V {
    const id = formatUuid(key);
    if (this.#entries.has(id)) return this.#entries.get(id) as V;
    this.#entries.set(id, defaultValue);
    return defaultValue;
  }

  getOrInsertComputed(key: UuidInput, callback: (key: CanonicalUuid) => V): V {
    if (typeof callback !== "function") throw new TypeError("Expected a callback function");
    const id = formatUuid(key);
    if (this.#entries.has(id)) return this.#entries.get(id) as V;
    const value = callback(id);
    // set also replaces an entry inserted by the callback and preserves its position.
    this.#entries.set(id, value);
    return value;
  }

  keys() { return this.#entries.keys(); }
  values() { return this.#entries.values(); }
  entries() { return this.#entries.entries(); }
  [Symbol.iterator]() { return this.entries(); }

  forEach(callback: (value: V, key: CanonicalUuid, map: this) => void, thisArg?: unknown): void {
    if (typeof callback !== "function") throw new TypeError("Expected a callback function");
    this.#entries.forEach((value, key) => callback.call(thisArg, value, key, this));
  }
}
