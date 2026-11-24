import assert from "node:assert/strict";
import {it} from "node:test";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {tmpdir} from "node:os";
import {runInNewContext} from "node:vm";
import {webcrypto} from "node:crypto";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);

it("provides self-contained packed ESM/CJS exports, strict consumer types and browser code", () => {
  const directory = mkdtempSync(join(tmpdir(), "uuid-consumer-"));
  try {
    const packed = JSON.parse(execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", directory],
      {cwd: root, encoding: "utf8", env: {...process.env, npm_config_cache: join(directory, "npm-cache")}}));
    const files = packed[0].files.map(file => file.path);
    for (const file of ["README.md", "LICENSE.md", "AUTHORS", "dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts", "dist/index.node.d.cts"]) {
      assert.ok(files.includes(file), `missing packed file: ${file}`);
    }
    assert.equal(files.some(file => file.startsWith("test/") || file.startsWith("src/") || file.startsWith("scripts/")), false);
    const packageDir = join(directory, "node_modules/@powfix/uuid");
    mkdirSync(packageDir, {recursive: true});
    execFileSync("tar", ["-xzf", join(directory, packed[0].filename), "--strip-components=1", "-C", packageDir]);
    const nested = join(directory, "other/node_modules/@powfix/uuid");
    mkdirSync(nested, {recursive: true});
    execFileSync("tar", ["-xzf", join(directory, packed[0].filename), "--strip-components=1", "-C", nested]);
    const body = `
      const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      for (const api of [shared, node]) {
        const map = new api.UuidMap([[api.UUID.from(id), "ok"]]);
        if ([...map.keys()][0] !== id) throw Error("canonical key missing");
        if (map.get(id.toUpperCase()) !== "ok") throw Error("map lookup failed");
        const set = new api.UuidSet([id]);
        if ([...set][0] !== id) throw Error("canonical value missing");
        if (set.union(new Set([api.UUID.from(id).toBytes()])).size !== 1) throw Error("union failed");
      }
      const row = {uuid: node.UUID.from(id)};
      const buffer = row.uuid.toBuffer();
      if (!Buffer.isBuffer(buffer) || !buffer.equals(node.toBuffer(id))) throw Error("model UUID bytes differ");
      buffer.fill(0);
      if (!node.parse(id).toBuffer().equals(row.uuid.toBuffer())) throw Error("model UUID was mutated");
      if (shared.UuidMap !== node.UuidMap) throw Error("duplicate entry-point collections");
      if (!shared.UUID.equals(node.UUID.from(id), id)) throw Error("entry-point UUID mismatch");
    `;
    writeFileSync(join(directory, "consumer.mjs"), `import * as shared from "@powfix/uuid"; import * as node from "@powfix/uuid/node"; ${body}`);
    writeFileSync(join(directory, "consumer.cjs"), `const shared = require("@powfix/uuid"); const node = require("@powfix/uuid/node"); ${body}`);
    for (const filename of ["consumer.mjs", "consumer.cjs"]) execFileSync(process.execPath, [join(directory, filename)], {cwd: directory});

    writeFileSync(join(directory, "mixed.mjs"), `
      import assert from "node:assert/strict";
      import {createRequire} from "node:module";
      import {UUID, UuidMap, UuidSet, parse, v4, v7} from "@powfix/uuid";
      import {UUID as NodeUUID, toBuffer} from "@powfix/uuid/node";
      const require = createRequire(import.meta.url);
      const common = require("@powfix/uuid");
      const node = require("@powfix/uuid/node");
      const other = createRequire(new URL("./other/consumer.cjs", import.meta.url))("@powfix/uuid");
      assert.equal(UUID, common.UUID);
      assert.equal(UUID, NodeUUID);
      assert.equal(UUID, node.UUID);
      assert.equal(NodeUUID.toBuffer, toBuffer);
      assert.equal(node.UUID.toBuffer, common.UUID.toBuffer);
      assert.equal(node.UUID.toBuffer, node.toBuffer);
      assert.equal(UuidMap, node.UuidMap);
      assert.equal(UuidSet, common.UuidSet);
      assert.equal(v4().version(), 4);
      assert.equal(v7().version(), 7);
      const foreign = other.parse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
      assert.notEqual(UUID, other.UUID);
      const local = parse(foreign);
      assert.ok(local instanceof node.UUID);
      assert.equal(local.equals(other.parse(local)), true);
      assert.deepEqual(toBuffer(foreign), Buffer.from(local.toBytes()));
      assert.deepEqual(NodeUUID.toBuffer(foreign), local.toBuffer());
      assert.deepEqual(node.UUID.from(foreign).toBuffer(), toBuffer(foreign));
      assert.deepEqual(NodeUUID.parse(node.UUID.from(foreign)).toBuffer(), local.toBuffer());
      assert.equal(new UuidMap([[foreign, 1]]).get(local), 1);
      assert.equal(new other.UuidSet([local]).has(foreign), true);
    `);
    execFileSync(process.execPath, [join(directory, "mixed.mjs")], {cwd: directory});

    // A model can import its Node UUID type without loading /node until later.
    writeFileSync(join(directory, "root-first.cjs"), `
      const assert = require("node:assert/strict");
      const root = require("@powfix/uuid");
      const id = root.UUID.nil();
      assert.deepEqual(id.toBuffer(), Buffer.alloc(16));
      assert.deepEqual(root.UUID.toBuffer(id), Buffer.alloc(16));
      const node = require("@powfix/uuid/node");
      assert.equal(node.parse(id), id);
      assert.equal(root.UUID, node.UUID);
    `);
    execFileSync(process.execPath, [join(directory, "root-first.cjs")], {cwd: directory});

    for (const fixture of ["consumer-types", "consumer-node-types", "consumer-platform-types"]) {
      for (const ext of ["mts", "cts"]) copyFileSync(join(root, `test/${fixture}.ts`), join(directory, `consumer.${ext}`));
      const nodeTypes = fixture !== "consumer-types";
      const nodeLibs = fixture === "consumer-platform-types" ? [] : ["ES2020", "ESNext"];
      const configurations = nodeLibs.map(lib => ({
        module: "NodeNext", moduleResolution: "NodeNext", lib: [lib, "DOM"], files: ["consumer.mts", "consumer.cts"],
      }));
      if (fixture !== "consumer-node-types") configurations.push({
        module: "ESNext", moduleResolution: "Bundler", lib: ["ES2020"], files: ["consumer.mts"],
      });
      for (const {module, moduleResolution, lib, files} of configurations) {
        writeFileSync(join(directory, "tsconfig.json"), JSON.stringify({
          compilerOptions: {module, moduleResolution, target: "ES2020", lib, strict: true, skipLibCheck: false, noEmit: true,
            types: nodeTypes ? ["node"] : [],
            typeRoots: [dirname(dirname(require.resolve("@types/node/package.json")))]},
          files,
        }));
        try {
          execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "-p", join(directory, "tsconfig.json")], {cwd: directory});
        } catch (error) {
          throw new Error(`${fixture} (${moduleResolution}, ${lib}): ${error.stdout} ${error.stderr}`);
        }
      }
    }

    const browser = require("esbuild").buildSync({
      stdin: {contents: `import {UUID, UuidMap, UuidSet} from "@powfix/uuid";
        const id = UUID.v4();
        const map = new UuidMap([[id.toBytes(), true]]);
        if (map.getOrInsert(id, false) !== true) throw Error("browser UUID insertion failed");
        if (!map.get(id)) throw Error("browser lookup failed");
        const set = new UuidSet([id]);
        const other = new Set([id.toString()]);
        if (set.union(other).size !== 1) throw Error("browser union failed");
        if (set.intersection(other).size !== 1) throw Error("browser intersection failed");
        if (set.difference(other).size !== 0) throw Error("browser difference failed");
        if (set.symmetricDifference(other).size !== 0) throw Error("browser symmetric difference failed");
        if (!set.isSubsetOf(other) || !set.isSupersetOf(other) || set.isDisjointFrom(other)) throw Error("browser predicates failed");
        if (typeof Buffer !== "undefined" || "toBuffer" in UUID || "toBuffer" in id) throw Error("browser test exposed Node Buffer");`, resolveDir: directory},
      bundle: true, platform: "browser", target: "es2020", format: "iife", write: false,
    });
    // Also exercise ES2020-style runtimes with no native Set composition methods.
    const withoutNativeOperations = `
      for (const name of ["union", "intersection", "difference", "symmetricDifference", "isSubsetOf", "isSupersetOf", "isDisjointFrom"]) {
        delete Set.prototype[name];
      }
    `;
    runInNewContext(withoutNativeOperations + browser.outputFiles[0].text, {crypto: webcrypto}, {timeout: 1000});
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
