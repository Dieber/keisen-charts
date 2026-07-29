import type { Framework } from "./frameworkPreference";

/** Published package version used by Sandpack demos */
export const KEISEN_NPM_VERSION = "0.1.5";

export const SANDPACK_REACT_DEPS = {
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  "@keisen-charts/react": KEISEN_NPM_VERSION,
} as const;

export const SANDPACK_VUE_DEPS = {
  vue: "^3.5.0",
  "@keisen-charts/vue": KEISEN_NPM_VERSION,
} as const;

export function sandpackTemplate(fw: Framework) {
  return fw === "react" ? ("react-ts" as const) : ("vue-ts" as const);
}

export function sandpackDeps(fw: Framework) {
  return fw === "react" ? SANDPACK_REACT_DEPS : SANDPACK_VUE_DEPS;
}

export function keisenPackageName(fw: Framework) {
  return fw === "react" ? "@keisen-charts/react" : "@keisen-charts/vue";
}
