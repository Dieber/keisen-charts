import { existsSync } from "node:fs";
import { join } from "node:path";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

export const detectPackageManager = (cwd: string): PackageManager => {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("bun/")) return "bun";
  if (ua.startsWith("pnpm/")) return "pnpm";
  if (ua.startsWith("yarn/")) return "yarn";
  if (ua.startsWith("npm/")) return "npm";

  if (existsSync(join(cwd, "bun.lock")) || existsSync(join(cwd, "bun.lockb"))) {
    return "bun";
  }
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (
    existsSync(join(cwd, "yarn.lock")) ||
    existsSync(join(cwd, ".yarn"))
  ) {
    return "yarn";
  }
  return "npm";
};

export const installHint = (
  pm: PackageManager,
  pkg: string,
): string => {
  switch (pm) {
    case "bun":
      return `bun add ${pkg}`;
    case "pnpm":
      return `pnpm add ${pkg}`;
    case "yarn":
      return `yarn add ${pkg}`;
    default:
      return `npm install ${pkg}`;
  }
};
