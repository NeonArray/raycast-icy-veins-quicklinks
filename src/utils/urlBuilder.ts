import type { ParsedInput } from "../types";

const BASE = "https://www.icy-veins.com/wow";

export function buildUrl(input: ParsedInput): string {
  const { spec, mode, page } = input;

  if (page.special) {
    return `${BASE}/${spec.slug}-${page.urlSuffix}`;
  }

  if (mode === "pvp") {
    return `${BASE}/${spec.slug}-${page.urlSuffix}`;
  }

  return `${BASE}/${spec.slug}-pve-${spec.pveRole}-${page.urlSuffix}`;
}
