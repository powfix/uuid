# @powfix/uuid

UUID creation, conversion and comparison, plus maps and sets indexed by UUID value.
The package provides ESM, CommonJS and TypeScript declarations, with no runtime dependencies.

```sh
npm install @powfix/uuid
```

```ts
import {UUID, UuidMap, UuidSet, type UuidInput} from "@powfix/uuid";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bytes = UUID.from(id).toBytes();

UUID.equals(id, id.toUpperCase(), bytes); // true

const users = new UuidMap<UuidInput, string>();
users.set(id, "Alice");
users.get(bytes);                       // "Alice"
users.set(id.toUpperCase(), "Updated"); // replaces the existing value
users.size;                            // 1
[...users.keys()];                      // [id] (first spelling retained)

const selected = new UuidSet<string>([id]);
selected.has(bytes);                    // true
selected.delete(id.toUpperCase());      // true
```

For Node.js, the optional `UUID` subclass adds `toBuffer()`:

```ts
import {UUID, UuidMap, UuidSet} from "@powfix/uuid/node";
const id = UUID.v4();
const selected = new UuidSet([id]);
selected.has(id.toBuffer()); // true
```

```js
const {UUID, UuidMap, UuidSet} = require("@powfix/uuid");
```

Both entry points expose the same collection classes. The root entry is browser-compatible
and does not import Node.js modules. Built JavaScript targets ES2020; `UUID.v4()` requires
`globalThis.crypto.getRandomValues`. Use a runtime providing that Web Crypto API.

## UUID input and comparison

`UuidInput` accepts UUID strings (32 hexadecimal characters or the canonical
8-4-4-4-12 format), `Uint8Array`, Node.js `Buffer`, and `UUID` instances.
Byte inputs must contain exactly 16 bytes. String case and hyphens do not affect equality.
UUIDs are [128-bit identifiers](https://www.rfc-editor.org/rfc/rfc9562.html#section-4).

`UUID.equals(a, b, ...rest)` requires at least two inputs and tests whether **all**
UUID values are equal. A nullish input makes the result false, including `equals(null, null)`.
It is not an array-membership callback; use `ids.some(id => UUID.equals(id, target))`.

The collections accept nil, max and other correctly encoded 128-bit UUID values.
They do not add version/variant restrictions.
The existing `UUID.isValid` API additionally checks the RFC variant and versions 1–5;
that validation policy is separate from parsing and has not changed in this release.
The collections reject malformed strings and byte arrays before indexing them.
The existing `UUID` parsing and validation APIs are unchanged.

## Collection contract

`UuidMap<K extends UuidInput = UuidInput, V = unknown>` and
`UuidSet<K extends UuidInput = UuidInput>` extend native `Map<K, V>` and `Set<K>`:

| API | UuidMap | UuidSet |
| --- | --- | --- |
| Create | `new UuidMap(entries?)` | `new UuidSet(values?)` |
| Write | `set(key, value)` | `add(value)` |
| Read/remove | `get`, `has`, `delete`, `clear`, `size` | `has`, `delete`, `clear`, `size` |
| Iterate | `keys`, `values`, `entries`, `forEach`, `Symbol.iterator` | same |

Constructors accept iterables, `null` or `undefined`. Write methods are chainable.
Lookup and deletion accept any UUID representation independently of `K`.
Nullish lookup arguments return `undefined` (`get`) or `false` (`has`/`delete`).
Nullish writes and malformed non-nullish inputs throw. Failed writes leave the collection unchanged.

The first inserted key's representation and insertion order are preserved. Replacing
an existing value does not move it; deleting and re-adding it places it last.
`forEach` receives `(value, key, collection)` for maps or `(value, value, collection)`
for sets and supports `thisArg`. Iteration remains live when entries are added/deleted.
Map values are stored and returned by reference, including `undefined` values.

### Mutable keys

Mutable UUID keys are copied both on insertion and on output (`keys`, `entries`,
iteration and `forEach`). Mutating an input buffer, `UUID.bytes`, or a returned key
cannot corrupt the collection's stored key. A mutated input now represents a different
UUID, so looking it up uses its **current** bytes. String spelling is preserved;
Buffer outputs remain Buffers, and Node UUID outputs retain `toBuffer()`.
UUID subclasses are copied via their constructor's static `from` factory.
Typed-array subclasses follow their `map`/species copy behavior.

Mutable output keys are fresh copies; compare them with `UUID.equals`, not object identity.

### Relationship to native collections

These classes use native backing storage: `instanceof Map` / `instanceof Set`, native
collection detection, `size`, iteration, and APIs receiving `Map<K, V>` / `Set<K>` work.
`Object.prototype.toString` reports `[object Map]` / `[object Set]`. A private canonical
UUID index makes lookups independent of the input representation without scanning keys.

Call instance methods (`map.set(...)`, `set.union(...)`) to keep UUID semantics.
Explicitly borrowing native methods, such as `Map.prototype.set.call(map, ...)`, bypasses
the overrides and is **unsupported**: writes can desynchronize the UUID index, native
lookups use identity equality, and native iterators expose the stored mutable keys.
Native Set operations called directly through `Set.prototype` also bypass UUID equality.
An ordinary Set used as the receiver of an operation keeps that Set's native semantics;
use a UuidSet receiver when the operation needs UUID equality.

`new Map(uuidMap)` / `new Set(uuidSet)` create ordinary collections using native equality.
Native structured cloning likewise produces ordinary collections and loses UUID semantics;
UUID instance keys also lose their class prototype during cloning. Use
`new UuidMap(uuidMap)` / `new UuidSet(uuidSet)` to preserve the collection contract.
Libraries that only inspect or invoke instance methods are compatible; libraries that
borrow native methods or depend on key object identity require separate consideration.

UUID inputs remain mandatory. Native-compatible set-like method signatures can accept
unknown or non-UUID element types, but every operand key is parsed at runtime and
non-UUID values throw. Inheritance does not make these general-purpose collections.

## Set operations

```ts
const a = new UuidSet<string>([id]);
const b = new Set([UUID.from(id).toBytes()]);

a.union(b).size;          // 1, result: UuidSet<string | Uint8Array>
a.intersection(b);       // UuidSet<string>, retaining a's representation
a.difference(b).size;    // 0
a.symmetricDifference(b).size; // 0
a.isSubsetOf(b);         // true
a.isSupersetOf(b);       // true
a.isDisjointFrom(b);     // false
```

Operands may be finite UUID iterables or set-like objects with `size`, `has`, and `keys`
(including native Map keys). All operand keys are enumerated and validated; their own
`has` implementation is not used to determine UUID equality. Invalid operands/keys throw.
Operations do not mutate either operand and normalize duplicate UUID representations.

`intersection` and `difference` retain the receiver's type and insertion order.
`union` keeps receiver values first and appends new operand values in operand order.
`symmetricDifference` emits receiver-only values followed by operand-only values.
All four return a `UuidSet`, including on runtimes without native Set composition methods.
They return the package's UuidSet even when invoked on a further subclass; custom
`Symbol.species` constructors are not consulted.

### TypeScript and intersection

Keep the `UuidSet` type and UUID-typed operands for UUID set operations. Its UUID overload
returns `UuidSet<K>` from `intersection`, because a string UUID may match bytes while the
result still contains the receiver's strings.

Native TypeScript `Set<K>.intersection` declares `Set<K & U>`, assuming native equality.
The compatibility overload must retain that declaration for native Set assignability.
If you widen a UuidSet to `Set<K>` / `ReadonlySet<K>`, or pass a generically typed set-like
operand not known to contain UUID inputs, TypeScript uses that native signature. It can
infer an incorrect intersection type for equivalent UUIDs in different representations.
The runtime still returns a UuidSet containing the receiver's representations. Do not
rely on that narrowed type; retain the UuidSet type and declare operands as UUID inputs.
For generic code, `new UuidSet<UuidInput>(receiver)` and `new UuidSet<UuidInput>(operand)`
provide explicit UUID collection types before performing the operation.

## Development and packaging

```sh
npm install
npm test       # build, behavior tests, packed ESM/CJS imports, types and browser bundle
npm pack       # runs the same checks before producing a tarball
```

Published files include ESM/CJS runtime modules, `.d.ts` and `.d.cts` declarations,
this README, the license and authors. Tests and build scripts are development-only.

### Compatibility notes

The new collections use a canonical private index for efficient UUID-value lookup.
They do not require callers to convert inputs before comparison or lookup.
Collection-local validation rejects malformed hex, misplaced hyphens and byte arrays
whose length is not 16, preventing invalid keys from colliding in the UUID index.
No changes to the existing `UUID` parsing or nullish `UUID.from` behavior are required.
