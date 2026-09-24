// Permite que `node --test` importe los módulos TypeScript del frontend tal como
// los escribe Next: con el alias `@/` y sin extensión.
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = new URL('../', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  let target = specifier;
  if (specifier.startsWith('@/')) target = new URL(specifier.slice(2), ROOT).href;
  else if (specifier.startsWith('.') && context.parentURL) target = new URL(specifier, context.parentURL).href;
  else return nextResolve(specifier, context);

  const path = fileURLToPath(target);
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, `${path}/index.ts`]) {
    if (existsSync(candidate) && !candidate.endsWith('/')) {
      try {
        return nextResolve(pathToFileURL(candidate).href, context);
      } catch {
        // probar el siguiente
      }
    }
  }
  return nextResolve(specifier, context);
}
