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
    const body = `
      const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      for (const api of [shared, node]) {
        const map = new api.UuidMap([[api.UUID.from(id), "ok"]]);
        if (!(map instanceof Map)) throw Error("native Map identity missing");
        if (map.get(id.toUpperCase()) !== "ok") throw Error("map lookup failed");
        const set = new api.UuidSet([id]);
        if (!(set instanceof Set)) throw Error("native Set identity missing");
        if (set.union(new Set([api.UUID.from(id).toBytes()])).size !== 1) throw Error("union failed");
      }
      if (node.UUID.from(id).toBuffer().length !== 16) throw Error("node UUID missing");
      if (shared.UuidMap !== node.UuidMap) throw Error("duplicate entry-point collections");
      if (!shared.UUID.equals(node.UUID.from(id), id)) throw Error("entry-point UUID mismatch");
    `;
    writeFileSync(join(directory, "consumer.mjs"), `import * as shared from "@powfix/uuid"; import * as node from "@powfix/uuid/node"; ${body}`);
    writeFileSync(join(directory, "consumer.cjs"), `const shared = require("@powfix/uuid"); const node = require("@powfix/uuid/node"); ${body}`);
    for (const filename of ["consumer.mjs", "consumer.cjs"]) execFileSync(process.execPath, [join(directory, filename)], {cwd: directory});

    for (const fixture of ["consumer-types", "consumer-node-types"]) {
      for (const ext of ["mts", "cts"]) copyFileSync(join(root, `test/${fixture}.ts`), join(directory, `consumer.${ext}`));
      for (const lib of ["ES2020", "ESNext"]) {
        writeFileSync(join(directory, "tsconfig.json"), JSON.stringify({
          compilerOptions: {module: "NodeNext", moduleResolution: "NodeNext", target: "ES2020", lib: [lib, "DOM"], strict: true, skipLibCheck: false, noEmit: true,
            types: fixture === "consumer-node-types" ? ["node"] : [],
            typeRoots: [dirname(dirname(require.resolve("@types/node/package.json")))]},
          files: ["consumer.mts", "consumer.cts"]
        }));
        try {
          execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "-p", join(directory, "tsconfig.json")], {cwd: directory});
        } catch (error) {
          throw new Error(`${fixture} (${lib}): ${error.stdout} ${error.stderr}`);
        }
      }
    }

    const browser = require("esbuild").buildSync({
      stdin: {contents: `import {UUID, UuidMap, UuidSet} from "@powfix/uuid";
        const id = UUID.v4();
        const map = new UuidMap([[id.toBytes(), true]]);
        if (!(map instanceof Map) || !(new UuidSet() instanceof Set)) throw Error("browser native identity failed");
        if (!map.get(id)) throw Error("browser lookup failed");
        const set = new UuidSet([id]);
        const other = new Set([id.toString()]);
        if (set.union(other).size !== 1) throw Error("browser union failed");
        if (set.intersection(other).size !== 1) throw Error("browser intersection failed");
        if (set.difference(other).size !== 0) throw Error("browser difference failed");
        if (set.symmetricDifference(other).size !== 0) throw Error("browser symmetric difference failed");
        if (!set.isSubsetOf(other) || !set.isSupersetOf(other) || set.isDisjointFrom(other)) throw Error("browser predicates failed");
        if (typeof Buffer !== "undefined") throw Error("browser test exposed Node Buffer");`, resolveDir: directory},
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
