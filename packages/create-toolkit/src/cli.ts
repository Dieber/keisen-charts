#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { copyTemplate } from "./copyTemplate";
import { detectPackageManager, installHint } from "./detectPm";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

type Framework = "react" | "vue";

type ToolkitId = "indicator";

type CliArgs = {
  toolkit: string | null;
  framework: Framework;
  dir: string;
  force: boolean;
  help: boolean;
};

const TOOLKIT_DEFAULT_DIR: Record<ToolkitId, string> = {
  indicator: "src/toolkits/indicator",
};

const printHelp = () => {
  console.log(`Usage:
  create-toolkit <toolkit> [options]

Toolkits:
  indicator     Content-only indicator settings panel (React)

Options:
  --framework <react|vue>   Target framework (default: react)
  --dir <path>              Output directory (default depends on toolkit)
  --force                   Overwrite existing files
  -h, --help                Show help

Examples:
  bunx @keisen-charts/create-toolkit indicator --framework react
  bunx @keisen-charts/create-toolkit indicator --dir src/components/keisen/indicator --force

Notes:
  - Copies panel content + CSS only (no Popover / Radix).
  - Mount UI inside your own shell (Vaul, Dialog, absolute dock, etc.).
  - Logic: @keisen-charts/react/toolkit (useKlineIndicator).
  - Drawing tools: use @keisen-charts/react/toolkit or @keisen-charts/vue/toolkit
    useDrawOverlay directly (no CLI scaffold).
`);
};

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = {
    toolkit: null,
    framework: "react",
    dir: "",
    force: false,
    help: false,
  };

  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token === "-h" || token === "--help") {
      args.help = true;
      continue;
    }
    if (token === "--force") {
      args.force = true;
      continue;
    }
    if (token === "--framework") {
      const value = argv[++i];
      if (value !== "react" && value !== "vue") {
        throw new Error(`Invalid --framework: ${value ?? "(missing)"}`);
      }
      args.framework = value;
      continue;
    }
    if (token === "--dir") {
      const value = argv[++i];
      if (!value) throw new Error("Missing value for --dir");
      args.dir = value;
      continue;
    }
    if (token.startsWith("-")) {
      throw new Error(`Unknown option: ${token}`);
    }
    positional.push(token);
  }

  args.toolkit = positional[0] ?? null;
  return args;
};

const hasDependency = (cwd: string, name: string): boolean => {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    return Boolean(
      pkg.dependencies?.[name] ||
        pkg.devDependencies?.[name] ||
        pkg.peerDependencies?.[name],
    );
  } catch {
    return false;
  }
};

const isToolkitId = (value: string): value is ToolkitId =>
  value === "indicator";

const printNextSteps = (
  toolkit: ToolkitId,
  framework: Framework,
  dir: string,
  pm: ReturnType<typeof detectPackageManager>,
) => {
  void toolkit;
  const normalized = dir.replace(/\\/g, "/");
  const importPath = isAbsolute(dir)
    ? normalized
    : `./${normalized.replace(/^\.\//, "")}`;
  const pkg = framework === "vue" ? "@keisen-charts/vue" : "@keisen-charts/react";

  console.log(`
Next steps:

1. Ensure logic package is installed:
   ${installHint(pm, pkg)}

2. Wire the hook + content panel (shell is yours):

   import { KeisenChart, MainKlineChart, KlineCandles } from "${pkg}";
   import { useKlineIndicator, IndicatorSettingsPanel } from "${importPath}";

   const indicator = useKlineIndicator();

   // Put the panel in any container — Popover, Vaul drawer, Dialog, sidebar, etc.
   <YourShell>
     <IndicatorSettingsPanel {...indicator.panelProps} />
   </YourShell>

   <KeisenChart ...>
     <MainKlineChart>
       <KlineCandles />
       {indicator.mainLayers}
     </MainKlineChart>
     {indicator.paneCharts}
   </KeisenChart>

3. Tweak colors via CSS variables on .keisen-toolkit-indicator
   (see ${normalized}/indicator-toolkit.css).
`);
};

const main = () => {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    printHelp();
    process.exit(1);
  }

  if (args.help || !args.toolkit) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (!isToolkitId(args.toolkit)) {
    console.error(
      `Unknown toolkit "${args.toolkit}". Currently supported: indicator`,
    );
    process.exit(1);
  }

  const toolkit = args.toolkit;

  if (args.framework === "vue" && toolkit === "indicator") {
    console.error(
      "Vue templates for indicator are not available yet. Use --framework react.",
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  const dir = args.dir || TOOLKIT_DEFAULT_DIR[toolkit];
  const targetDir = isAbsolute(dir) ? dir : resolve(cwd, dir);
  const templateDir = join(
    PACKAGE_ROOT,
    "templates",
    args.framework,
    toolkit,
  );

  const pm = detectPackageManager(cwd);
  console.log(`Package manager: ${pm}`);

  const logicPkg =
    args.framework === "vue" ? "@keisen-charts/vue" : "@keisen-charts/react";
  if (!hasDependency(cwd, logicPkg)) {
    console.warn(
      `Warning: ${logicPkg} not found in package.json. Install with:\n  ${installHint(pm, logicPkg)}`,
    );
  }

  try {
    const result = copyTemplate(templateDir, targetDir, args.force);
    console.log(`Wrote toolkit scaffold → ${targetDir}`);
    if (result.written.length > 0) {
      console.log(`  created: ${result.written.join(", ")}`);
    }
    if (result.skipped.length > 0) {
      console.warn(
        `  skipped (exists, use --force): ${result.skipped.join(", ")}`,
      );
    }
    if (result.written.length === 0 && result.skipped.length > 0) {
      console.warn("No files written. Re-run with --force to overwrite.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  printNextSteps(toolkit, args.framework, dir, pm);
};

main();
