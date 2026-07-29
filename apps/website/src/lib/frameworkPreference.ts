export type Framework = "react" | "vue";

const STORAGE_KEY = "keisen-docs-fw";
const QUERY_KEY = "fw";

export function isFramework(value: unknown): value is Framework {
  return value === "react" || value === "vue";
}

export function readFrameworkFromUrl(search = window.location.search): Framework | null {
  const fw = new URLSearchParams(search).get(QUERY_KEY);
  return isFramework(fw) ? fw : null;
}

export function readFrameworkFromStorage(): Framework | null {
  try {
    const fw = localStorage.getItem(STORAGE_KEY);
    return isFramework(fw) ? fw : null;
  } catch {
    return null;
  }
}

export function resolveInitialFramework(): Framework {
  return readFrameworkFromUrl() ?? readFrameworkFromStorage() ?? "react";
}

export function persistFramework(fw: Framework): void {
  try {
    localStorage.setItem(STORAGE_KEY, fw);
  } catch {
    // ignore quota / private mode
  }

  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_KEY, fw);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
