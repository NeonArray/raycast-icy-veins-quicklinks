import { getPreferenceValues } from "@raycast/api";
import { specs } from "../data/specs";
import type { SpecEntry } from "../types";

interface FavPrefs {
  favorite1: string;
  favorite2: string;
  favorite3: string;
  favorite4: string;
  favorite5: string;
}

export function getFavoriteSpecs(): SpecEntry[] {
  const prefs = getPreferenceValues<FavPrefs>();
  const seen = new Set<string>();
  return [
    prefs.favorite1,
    prefs.favorite2,
    prefs.favorite3,
    prefs.favorite4,
    prefs.favorite5,
  ]
    .map((slug) => slug?.trim().toLowerCase())
    .filter(Boolean)
    .filter((slug) => {
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    })
    .map((slug) => specs.find((s) => s.slug === slug))
    .filter((s): s is SpecEntry => s !== undefined);
}
