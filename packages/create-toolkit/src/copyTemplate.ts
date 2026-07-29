import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

export type CopyResult = {
  written: string[];
  skipped: string[];
};

const listFilesRecursive = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listFilesRecursive(full));
    } else {
      files.push(full);
    }
  }
  return files;
};

export const copyTemplate = (
  templateDir: string,
  targetDir: string,
  force: boolean,
): CopyResult => {
  if (!existsSync(templateDir)) {
    throw new Error(`Template not found: ${templateDir}`);
  }

  mkdirSync(targetDir, { recursive: true });

  const written: string[] = [];
  const skipped: string[] = [];
  const files = listFilesRecursive(templateDir);

  for (const source of files) {
    const rel = relative(templateDir, source);
    const dest = join(targetDir, rel);
    if (existsSync(dest) && !force) {
      skipped.push(rel);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(source, dest);
    written.push(rel);
  }

  return { written, skipped };
};
