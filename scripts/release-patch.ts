/**
 * Bump patch on @keisen-charts/{core,vue,react} and publish all three to npm.
 * Rewrites workspace:* deps to the new concrete version for publish, then restores them.
 *
 * Usage: bun scripts/release-patch.ts
 *        bun scripts/release-patch.ts --dry-run
 */
import { join } from "node:path";

const dryRun = Bun.argv.includes("--dry-run");
const root = join(import.meta.dir, "..");
const packages = ["core", "vue", "react"] as const;

type PkgJson = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
};

function bumpPatch(version: string): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid semver: ${version}`);
  }
  parts[2]! += 1;
  return parts.join(".");
}

async function readPkg(name: string): Promise<{ path: string; pkg: PkgJson; raw: string }> {
  const path = join(root, "packages", name, "package.json");
  const raw = await Bun.file(path).text();
  return { path, pkg: JSON.parse(raw) as PkgJson, raw };
}

async function writePkg(path: string, pkg: PkgJson) {
  await Bun.write(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function updateSandpackVersion(version: string) {
  const path = join(root, "apps/website/src/lib/sandpackConfig.ts");
  const src = await Bun.file(path).text();
  const next = src.replace(
    /export const KEISEN_NPM_VERSION = "[^"]+"/,
    `export const KEISEN_NPM_VERSION = "${version}"`,
  );
  if (next === src) {
    console.warn("sandpackConfig.ts: KEISEN_NPM_VERSION not updated (pattern not found)");
    return;
  }
  await Bun.write(path, next);
  console.log(`Updated sandpackConfig.ts → ${version}`);
}

async function publishPackage(name: string, version: string) {
  const { path, pkg } = await readPkg(name);
  const originalDeps = pkg.dependencies ? { ...pkg.dependencies } : undefined;

  if (pkg.dependencies) {
    for (const [dep, ver] of Object.entries(pkg.dependencies)) {
      if (ver !== "workspace:*" || !dep.startsWith("@keisen-charts/")) continue;
      pkg.dependencies[dep] = version;
    }
  }

  await writePkg(path, pkg);

  try {
    console.log(`\nPublishing ${pkg.name}@${pkg.version}${dryRun ? " (dry-run)" : ""}…`);
    const args = ["bun", "publish"];
    if (dryRun) args.push("--dry-run");
    const proc = Bun.spawn(args, {
      cwd: join(root, "packages", name),
      stdout: "inherit",
      stderr: "inherit",
    });
    const code = await proc.exited;
    if (code !== 0) {
      throw new Error(`bun publish failed for ${pkg.name} (exit ${code})`);
    }
  } finally {
    if (originalDeps) {
      pkg.dependencies = originalDeps;
    } else {
      delete pkg.dependencies;
    }
    await writePkg(path, pkg);
  }
}

const versions = new Set<string>();
for (const name of packages) {
  const { pkg } = await readPkg(name);
  versions.add(pkg.version);
}
if (versions.size !== 1) {
  throw new Error(
    `Package versions are out of sync: ${[...versions].join(", ")}. Align them before releasing.`,
  );
}

const current = [...versions][0]!;
const next = bumpPatch(current);
console.log(`Bump ${current} → ${next}`);

for (const name of packages) {
  const { path, pkg } = await readPkg(name);
  pkg.version = next;
  await writePkg(path, pkg);
  console.log(`  ${pkg.name} → ${next}`);
}

await updateSandpackVersion(next);

for (const name of packages) {
  await publishPackage(name, next);
}

console.log(`\nDone. Released @keisen-charts/{core,vue,react}@${next}`);
