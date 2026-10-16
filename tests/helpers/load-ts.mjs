import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const requirePackage = createRequire(new URL('../../package.json', import.meta.url));
export function createLoader(globals = {}, stubs = {}) {
  const cache = new Map();
  function load(filename) {
    const absolute = filename instanceof URL ? fileURLToPath(filename) : path.resolve(filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} }; cache.set(absolute, module);
    const source = fs.readFileSync(absolute, 'utf8').replaceAll('import.meta.env', '({})');
    const code = ts.transpileModule(source, { compilerOptions: {
      target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
    } }).outputText;
    const require = specifier => {
      if (specifier in stubs) return stubs[specifier];
      if (!specifier.startsWith('.')) return requirePackage(specifier);
      return load(path.resolve(path.dirname(absolute), `${specifier}.ts`));
    };
    vm.runInNewContext(code, { module, exports: module.exports, require, console, URL, URLSearchParams,
      AbortController, TextEncoder, Uint8Array, ...globals }, { filename: absolute });
    return module.exports;
  }
  return load;
}
export function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key), clear: () => values.clear() };
}
