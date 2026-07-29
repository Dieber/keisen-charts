/**
 * Pack @keisen-charts/core + @keisen-charts/{vue|react} for use outside this monorepo.
 * Rewrites workspace:* deps to concrete versions so the tarball installs cleanly.
 *
 * Usage: bun scripts/pack-package.ts <vue|react>
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const target = Bun.argv[2];
if (target !== "vue" && target !== "react") {
  console.error("Usage: bun scripts/pack-package.ts <vue|react>");
  process.exit(1);
}

const root = join(import.meta.dir, "..");
const outDir = join(root, "packs");
await mkdir(outDir, { recursive: true });

async function packPackage(name: string) {
  const dir = join(root, "packages", name);
  const pkgPath = join(dir, "package.json");
  const original = await Bun.file(pkgPath).text();
  const pkg = JSON.parse(original) as {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
  };

  if (pkg.dependencies) {
    for (const [dep, ver] of Object.entries(pkg.dependencies)) {
      if (ver !== "workspace:*" || !dep.startsWith("@keisen-charts/")) continue;
      const depDir = dep.replace("@keisen-charts/", "");
      const depPkg = await Bun.file(
        join(root, "packages", depDir, "package.json"),
      ).json();
      pkg.dependencies[dep] = depPkg.version as string;
    }
  }

  await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  try {
    const proc = Bun.spawn(
      ["bun", "pm", "pack", "--destination", outDir],
      { cwd: dir, stdout: "inherit", stderr: "inherit" },
    );
    const code = await proc.exited;
    if (code !== 0) {
      throw new Error(`bun pm pack failed for ${pkg.name} (exit ${code})`);
    }
  } finally {
    await Bun.write(pkgPath, original);
  }
}

await packPackage("core");
await packPackage(target);
console.log(`\nPacked @keisen-charts/core + @keisen-charts/${target} → packs/`);
