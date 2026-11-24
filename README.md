# @powfix/uuid

Parse UUIDs from strings, bytes and existing UUID objects. The same immutable value works in browsers, React Native and Node.js. The package includes UUIDv4 and UUIDv7 generators, value-keyed maps and sets, and TypeScript declarations. It has zero runtime dependencies.

```sh
npm install @powfix/uuid
```

## Start with parse

```ts
import {parseUuid, tryParse, parseNullable} from "@powfix/uuid";

const id = parseUuid("00112233445546778899AABBCCDDEEFF");
id.toString();              // "00112233-4455-4677-8899-aabbccddeeff"
const bytes = id.toBytes(); // an independent Uint8Array of 16 bytes
parseUuid(bytes).equals(id); // true
JSON.stringify({id});       // {"id":"00112233-4455-4677-8899-aabbccddeeff"}

tryParse(id)?.toHex();      // "00112233445546778899aabbccddeeff"
tryParse("incomplete")?.toHex(); // undefined
parseNullable(null);        // null
parseNullable(undefined);   // undefined
```

| When you need to… | Use | On malformed input |
| --- | --- | --- |
| Read a required ID | `parseUuid(value)` or `parse(value)` | Throws `TypeError`, including for `null` and `undefined` |
| Read user input that may be invalid | `tryParse(value)` | Returns `undefined` |
| Read an optional DB or API field | `parseNullable(value)` | Preserves `null` and `undefined`. Other malformed inputs throw `TypeError` |
| Get just the canonical string | `format(value)` | Throws `TypeError` |

`parseUuid`, `parse` and `UUID.parse` are the same function. Use `tryParse(value)?.toHex()` when a malformed or missing input should produce `undefined`. `from` and `UUID.from` are aliases of `parseNullable`. `new UUID(value)` also validates its input.

Accepted inputs are exactly 32 hexadecimal digits, the 36-character `8-4-4-4-12` form, a 16-byte `Uint8Array` (including a Node `Buffer`), or an object with a `toBytes()` method returning such a view. Both string forms accept either letter case. Whitespace, misplaced hyphens, incomplete pairs and other byte lengths fail validation. Byte views respect their offsets. UUID instances from earlier releases and separate package installations can be passed directly.

To convert an input directly, import one of these functions or call it on `UUID`. Each takes the same UUID representations as `parseUuid` and throws `TypeError` for malformed or missing values.

| Result | From any supported input | From a parsed UUID |
| --- | --- | --- |
| Lowercase dashed string | `format(value)` | `id.toString()` or `id.toJSON()` |
| 32 lowercase hex digits | `toHex(value)` | `id.toHex()` |
| Fresh 16-byte `Uint8Array` | `toBytes(value)` | `id.toBytes()` or `id.bytes` |

For generic hex data of any length, `Uint8ArrayUtils.fromHex(text)` and `Uint8ArrayUtils.toHex(bytes)` convert complete byte pairs.

## Generate, compare and validate

```ts
import {UUID, v4, v7, isUuidEncoding, isRfcUuid} from "@powfix/uuid";

const random = v4();            // also UUID.v4()
const timeOrdered = v7();       // also UUID.v7()
UUID.equals(random, random.toBytes());            // true
isRfcUuid(random, {versions: [4]});               // true
isRfcUuid(timeOrdered, {versions: [7]});          // true
isRfcUuid(random.toHex(), {encoding: "dashed"});  // false
isUuidEncoding(UUID.nil());                      // true
```

- `parse` and `isUuidEncoding` accept every correctly encoded 128-bit value, including padded binary identifiers. They preserve the original bits.
- `isRfcUuid` accepts the RFC variant with versions 1–8, plus the special nil and max UUIDs. Setting `versions` restricts the accepted versions and excludes those special values by default. Use `allowNil` or `allowMax` to set either policy explicitly. `encoding: "dashed"` and `encoding: "hex"` restrict the input to that string form.
- The existing `UUID.isValid`, `isValidString`, `isValidHex`, `isValidBytes` and instance `isValid()` keep the older RFC variant and version 1–5 policy. Use `isRfcUuid` for current RFC values or an explicit domain policy.
- `UUID.compare(a, b)` and `id.compare(other)` return `-1`, `0` or `1` in unsigned byte order. `UUID.equals(a, b, ...others)` checks that all compared values match. A nullish argument makes the comparison false. Invalid non-nullish inputs encountered during comparison throw. `id.version()` returns the raw version nibble. `UUID.nil()` and `UUID.max()` return the two special values.

The published JavaScript targets ES2020. Only UUID generation requires `globalThis.crypto.getRandomValues`. A React Native application should initialize a secure Web Crypto provider in its entry file before generating IDs. UUIDv7 records the Unix millisecond in the first 48 bits and draws independent random bits per call. IDs from different milliseconds sort by their encoded time. Within a millisecond their order is random, and a backward clock adjustment is reflected in the next timestamp. [RFC 9562, UUIDv7](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7)

## Node.js and database bytes

```ts
import {UUID, toBuffer} from "@powfix/uuid/node";

const text = "00112233-4455-4677-8899-aabbccddeeff";
const id = UUID.from(text);
const rowKey = UUID.toBuffer(text);
id.toBuffer().equals(rowKey); // true
toBuffer(id).equals(rowKey);  // true
```

Every UUID produced by `@powfix/uuid/node` supports `id.toBuffer()`. `UUID.toBuffer(value)` and the standalone `toBuffer(value)` are the same function. They accept strings, byte views and UUIDs from other installations. Each call returns a fresh 16-byte Node `Buffer` in network byte order. Malformed and nullish inputs throw `TypeError`. Both entry points share one `UUID` constructor in Node, including across `import` and `require`. Browser and React Native code can use `id.toBytes()` from the root entry.

## UUID maps and sets

```ts
import {UuidMap, UuidSet, parse} from "@powfix/uuid";

const text = "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA";
const id = parse(text);
const users = new UuidMap<string>();
users.set(text, "Alice");
users.get(id.toBytes());                   // "Alice"
users.getOrInsert(id, "fallback");         // "Alice"
users.getOrInsertComputed(id, key => key); // "Alice"
[...users.keys()];                         // ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]

const selected = new UuidSet([text, id, id.toBytes()]);
selected.size;                             // 1
selected.intersection(new Set([id])).has(text); // true
```

`UuidMap<V>` and `UuidSet` accept mixed UUID representations for reads and writes. Iteration yields canonical strings in insertion order. Replacing an entry keeps its position. Map values retain their identity, including a stored `undefined`. `getOrInsertComputed` calls its factory only for a missing key and supplies the canonical string. Nullish lookup or deletion returns `undefined` or `false`. A malformed key or nullish write throws.

Both collections provide `size`, `clear`, `delete`, `has`, `keys`, `values`, `entries`, `forEach` and live iteration. `UuidSet` also supports `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf` and `isDisjointFrom`. Set operations accept finite UUID iterables or set-like objects with `size`, `has` and `keys`, including native Map keys. Results retain receiver order and append new operand keys in operand order. A malformed operand key throws.

## Moving from 0.x

| 0.x usage | 1.0 usage |
| --- | --- |
| `UUID.from(x)` for known or optional inputs | This remains available. Choose `parse` for a required ID or `tryParse` for fallible input. The constructor and all factories now reject malformed encodings. |
| `UUID.from(x).toBuffer()` or `row.uuid.toBuffer()` | Keep the existing call when the UUID comes from `@powfix/uuid/node`. Use `UUID.toBuffer(x)` or `toBuffer(x)` to convert a raw value directly. Database bytes and JSON strings keep their representation. |
| Subclass-specific static factories | The built-in factories return the shared `UUID` type. Construct your own wrapper explicitly when an application attaches additional behavior. |
| Mutating `id.bytes` | Edit a copy from `id.toBytes()` and pass it to `parse` to create the new value. |
| `new UuidMap<K, V>()` or `new UuidSet<K>()` | Write `new UuidMap<V>()` or `new UuidSet()`. Iteration yields `CanonicalUuid`. Keep original spelling or input objects in the map value if the application displays them. |
| Native Map/Set subclasses, `instanceof Map`, or native-only consumers | The 1.0 collections own their storage. Accept their iterable or method interface, or use `new Map(uuidMap)` / `new Set(uuidSet)` for a native snapshot. Convert to entries before structured cloning and reconstruct the UUID collection afterwards. |
| Passing UUIDs through libraries with different installed versions | 1.0 accepts older objects via `toBytes()`. When a 0.x library receives a 1.0 value, pass `id.toString()` or `id.toBytes()`. Check known UUID fields at model serialization boundaries. |
| `UUID.from(null)` on 0.2.17 | `parse(null)` throws. `parseNullable(null)` and `UUID.from(null)` return `null`, as in 0.2.19 and 0.3. |

## Development

Public UUID helpers live in files named for their implementation, such as `compare.ts` and `parseUuid.ts`. Named exports match their class methods (`compare` and `UUID.compare`, for example). The strict parser also has the explicit import name `parseUuid`. Type declarations are grouped by role in `*.types.ts` files.

```sh
npm test   # build and exercise runtime, packaged imports, browser code and strict consumer types
npm pack   # run prepack checks and create the release tarball
```
