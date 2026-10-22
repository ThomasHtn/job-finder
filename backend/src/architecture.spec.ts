import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Source root, the folder of this file.
 */
const SRC = import.meta.dirname;

/**
 * Folders each one may import besides itself, row by row (README, "Packages"): a row leans on the
 * rows above it, never on a sibling. `generated` is the Prisma client, part of shared.
 */
const ALLOWED: Record<string, string[]> = {
  shared: ['generated'],
  auth: ['shared', 'generated'],
  geo: ['shared', 'generated'],
  health: ['shared', 'generated'],
  jobs: ['shared', 'generated'],
  sources: ['shared', 'generated'],
  'app-config': ['shared', 'generated', 'auth'],
  ingestion: ['shared', 'generated', 'geo', 'sources'],
  cli: ['shared', 'generated', 'auth', 'geo', 'ingestion'],
};

/**
 * The single database client; only services and repositories may hold it.
 */
const PRISMA_SERVICE = join(SRC, 'shared', 'prisma', 'prisma.service.ts');

/**
 * File names allowed to import PrismaService.
 */
const DATA_ACCESS = /\.(service|repository|spec)\.ts$/;

/**
 * Folders allowed to read `process.env`: the validated config, and the command-line tools that run
 * before or without the Nest container.
 */
const ENV_READERS = [join(SRC, 'shared', 'config'), join(SRC, 'cli')];

/**
 * Every TypeScript file of a folder, recursively, generated code excluded.
 */
function sources(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return entry.name === 'generated' ? [] : sources(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

/**
 * Absolute paths of the relative imports of a file, `.js` suffixes mapped back to `.ts`.
 */
function relativeImports(file: string): string[] {
  const code = readFileSync(file, 'utf8');
  return [...code.matchAll(/from '(\.{1,2}\/[^']+)\.js'/g)].map(([, path]) =>
    resolve(dirname(file), `${path}.ts`),
  );
}

/**
 * Top-level folder of a source file, or null for the root files (main.ts, app.module.ts).
 */
function folderOf(file: string): string | null {
  const parts = relative(SRC, file).split('/');
  return parts.length > 1 ? parts[0] : null;
}

/**
 * Files below a folder (rather than at the root), with the folder they belong to.
 */
const FILES = sources(SRC)
  .map((file) => ({ file, folder: folderOf(file) }))
  .filter((entry): entry is { file: string; folder: string } => entry.folder !== null);

/**
 * Layering of the backend: each folder leans on the rows above it only, never on a sibling.
 */
describe('architecture', () => {
  it('gives every folder its row', () => {
    const folders = new Set(FILES.map(({ folder }) => folder));

    expect([...folders].filter((folder) => !(folder in ALLOWED))).toEqual([]);
  });

  it('only lets a folder import the rows above it', () => {
    const violations = FILES.flatMap(({ file, folder }) =>
      relativeImports(file)
        .map((target) => folderOf(target))
        .filter((target): target is string => target !== null && target !== folder)
        .filter((target) => !ALLOWED[folder]?.includes(target))
        .map((target) => `${relative(SRC, file)} -> ${target}`),
    );

    expect(violations).toEqual([]);
  });

  it('keeps the database client in services and repositories', () => {
    const violations = FILES.filter(({ file }) => relativeImports(file).includes(PRISMA_SERVICE))
      .filter(({ file, folder }) => folder !== 'shared' && !DATA_ACCESS.test(file))
      .map(({ file }) => relative(SRC, file));

    expect(violations).toEqual([]);
  });

  it('reads process.env only in the config and the command-line tools', () => {
    const violations = sources(SRC)
      .filter((file) => file !== import.meta.filename)
      .filter((file) => !ENV_READERS.some((folder) => file.startsWith(`${folder}/`)))
      .filter((file) => readFileSync(file, 'utf8').includes('process.env'))
      .map((file) => relative(SRC, file));

    expect(violations).toEqual([]);
  });
});
