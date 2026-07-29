/** Docusaurus locale → @keisen-charts locale id */
export function chartLocaleFromSite(locale: string): string {
  if (locale === "en" || locale.startsWith("en-")) return "en-US";
  return "zh-CN";
}
