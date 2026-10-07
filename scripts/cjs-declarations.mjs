import {readdir, readFile, writeFile} from "node:fs/promises";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

async function declarationFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await declarationFiles(path));
    else if (path.endsWith(".d.ts")) files.push(path);
  }
  return files;
}

const files = await declarationFiles(fileURLToPath(new URL("../dist", import.meta.url)));
const declarations = new Set(files);
for (const path of files) {
  const text = await readFile(path, "utf8");
  // Resolve only emitted declarations; source imports keep the project's style.
  const esm = text.replace(/((?:from\s+|import\()["'])(\.[^"']*)(["'])/g,
    (match, prefix, specifier, suffix) => {
      if (specifier.endsWith(".js")) return match;
      const target = resolve(dirname(path), specifier);
      if (declarations.has(`${target}.d.ts`)) return `${prefix}${specifier}.js${suffix}`;
      if (declarations.has(join(target, "index.d.ts"))) return `${prefix}${specifier}/index.js${suffix}`;
      throw new Error(`Cannot resolve declaration import ${specifier} in ${path}`);
    });
  const commonJs = esm.replace(/((?:from\s+|import\()["']\.[^"']*)\.js(["'])/g, "$1.cjs$2");
  await writeFile(path, esm);
  await writeFile(path.replace(/\.d\.ts$/, ".d.cts"), commonJs);
}
