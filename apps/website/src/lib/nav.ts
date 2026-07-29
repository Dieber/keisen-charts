export type NavItem = {
  id: string;
  title: string;
  path: string;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    items: [
      { id: "introduction", title: "Introduction", path: "/" },
      { id: "quick-start", title: "Quick Start", path: "/docs/quick-start" },
    ],
  },
  {
    title: "Guides",
    items: [
      { id: "data", title: "Data", path: "/docs/guides/data" },
      { id: "resolution", title: "Resolution & symbol", path: "/docs/guides/resolution" },
      { id: "controlled", title: "Controlled & uncontrolled", path: "/docs/guides/controlled" },
      { id: "timezone", title: "Timezone", path: "/docs/guides/timezone" },
      { id: "i18n", title: "i18n", path: "/docs/guides/i18n" },
      { id: "theme", title: "Theme system", path: "/docs/guides/theme" },
      { id: "formatter", title: "Custom formatter", path: "/docs/guides/formatter" },
      { id: "panes", title: "Main / sub panes", path: "/docs/guides/panes" },
      { id: "indicators", title: "Indicators", path: "/docs/guides/indicators" },
      { id: "draw-tools", title: "Drawing tools", path: "/docs/guides/draw-tools" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "api", title: "API Reference", path: "/docs/api" },
    ],
  },
];

export function matchNavPath(pathname: string): string {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  for (const section of NAV) {
    for (const item of section.items) {
      if (item.path === normalized) return item.id;
    }
  }
  return "introduction";
}

export function pathForId(id: string): string {
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.id === id) return item.path;
    }
  }
  return "/";
}
