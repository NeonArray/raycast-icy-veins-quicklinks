import { wowClasses } from "../data/classes";
import { pageMap } from "../data/pages";
import { specs } from "../data/specs";
import type {
  ClassEntry,
  Mode,
  PageEntry,
  SpecEntry,
  Suggestion,
} from "../types";
import { getSuggestions } from "./suggestions";

export function getAvailableModes(spec: SpecEntry): Mode[] {
  return spec.pveRole === "tank" ? ["pve"] : ["pve", "pvp"];
}

export interface SpecGridItem {
  classEntry: ClassEntry;
  name: string;
  spec: SpecEntry;
}

export type GridState =
  | { kind: "classes"; items: ClassEntry[] }
  | { kind: "specs"; classEntry?: ClassEntry; items: SpecGridItem[] }
  | { kind: "modes"; items: Mode[]; spec: SpecEntry }
  | { kind: "pages"; items: PageEntry[]; mode: Mode; spec: SpecEntry }
  | { kind: "results"; suggestions: Suggestion[] };

const PAGE_TITLES: Record<string, string> = {
  guide: "Guide",
  "leveling-guide": "Leveling Guide",
  "easy-mode": "Easy Mode",
  "spec-builds-talents": "Builds & Talents",
  "rotation-cooldowns-abilities": "Rotation",
  "stat-priority": "Stat Priority",
  "gems-enchants-consumables": "Gems & Enchants",
  "gear-best-in-slot": "Gear",
  "mythic-plus-tips": "Mythic+ Tips",
  "spell-summary": "Spell Summary",
  "pvp-guide": "Guide",
  "pvp-talents-and-builds": "Talents & Builds",
  "pvp-stat-priority-gear-and-trinkets": "Gear & Trinkets",
  "pvp-rotation-and-playstyle": "Rotation & Playstyle",
  "battleground-blitz-pvp-guide": "Battleground Blitz",
  "pvp-best-arena-compositions": "Arena Comps",
  "pvp-useful-macros": "Macros",
  "pvp-best-races-and-racials": "Races & Racials",
  resources: "Resources",
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function startsWithBoundary(value: string, prefix: string): boolean {
  return value === prefix || value.startsWith(`${prefix} `);
}

function removePrefix(value: string, prefix: string): string {
  return value === prefix ? "" : value.slice(prefix.length).trimStart();
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getClassSpecs(classEntry: ClassEntry): SpecEntry[] {
  return specs.filter((spec) => spec.slug.endsWith(`-${classEntry.slug}`));
}

function getClassScopedSpecKeywords(
  spec: SpecEntry,
  classEntry: ClassEntry,
): string[] {
  const specName = spec.slug
    .slice(0, -`-${classEntry.slug}`.length)
    .replace(/-/g, " ");

  return Array.from(new Set([specName, ...spec.aliases]));
}

function getBestStartMatch<T>(
  normalizedQuery: string,
  entries: Array<{ aliases: string[]; item: T }>,
): { item: T; alias: string; remainingQuery: string } | null {
  let best: { item: T; alias: string; remainingQuery: string } | null = null;

  for (const entry of entries) {
    for (const alias of entry.aliases) {
      if (!startsWithBoundary(normalizedQuery, alias)) continue;

      if (!best || alias.length > best.alias.length) {
        best = {
          item: entry.item,
          alias,
          remainingQuery: removePrefix(normalizedQuery, alias),
        };
      }
    }
  }

  return best;
}

function getExactClassMatch(normalizedQuery: string) {
  return getBestStartMatch(
    normalizedQuery,
    wowClasses.map((classEntry) => ({
      aliases: classEntry.aliases,
      item: classEntry,
    })),
  );
}

function getExactGlobalSpecMatch(normalizedQuery: string) {
  return getBestStartMatch(
    normalizedQuery,
    specs.map((spec) => ({ aliases: spec.aliases, item: spec })),
  );
}

function getExactClassScopedSpecMatch(
  classEntry: ClassEntry,
  normalizedQuery: string,
) {
  return getBestStartMatch(
    normalizedQuery,
    getClassSpecs(classEntry).map((spec) => ({
      aliases: getClassScopedSpecKeywords(spec, classEntry),
      item: spec,
    })),
  );
}

function getSpecGridItems(classEntry: ClassEntry, prefix = ""): SpecGridItem[] {
  const normalizedPrefix = normalizeQuery(prefix);

  return getClassSpecs(classEntry)
    .filter(
      (spec) =>
        !normalizedPrefix ||
        getClassScopedSpecKeywords(spec, classEntry).some((keyword) =>
          keyword.startsWith(normalizedPrefix),
        ),
    )
    .map((spec) => ({
      classEntry,
      name: titleCase(
        spec.slug.slice(0, -`-${classEntry.slug}`.length).replace(/-/g, " "),
      ),
      spec,
    }));
}

function getGlobalSpecGridItems(prefix: string): SpecGridItem[] {
  const normalizedPrefix = normalizeQuery(prefix);

  return specs
    .filter((spec) =>
      spec.aliases.some((alias) => alias.startsWith(normalizedPrefix)),
    )
    .map((spec) => {
      const classEntry = getClassForSpec(spec);
      return {
        classEntry,
        name: titleCase(spec.aliases[0]),
        spec,
      };
    });
}

function getMatchingClasses(prefix: string): ClassEntry[] {
  const normalizedPrefix = normalizeQuery(prefix);
  return wowClasses.filter((classEntry) =>
    classEntry.aliases.some((alias) => alias.startsWith(normalizedPrefix)),
  );
}

function getPages(mode: Mode, prefix = ""): PageEntry[] {
  const normalizedPrefix = normalizeQuery(prefix);

  return [...pageMap[mode], ...pageMap.any].filter(
    (page) =>
      !normalizedPrefix ||
      page.aliases.some(
        (alias) => alias !== "" && alias.startsWith(normalizedPrefix),
      ),
  );
}

function resolveSpecState(
  spec: SpecEntry,
  remainingQuery: string,
  suggestionQueryPrefix: string,
): GridState {
  const normalizedRemaining = normalizeQuery(remainingQuery);

  if (!normalizedRemaining) {
    return { kind: "modes", items: getAvailableModes(spec), spec };
  }

  const [firstToken, ...rest] = normalizedRemaining.split(" ");

  if (firstToken === "pve" || firstToken === "pvp") {
    const pagePrefix = rest.join(" ");
    return {
      kind: "pages",
      items: getPages(firstToken, pagePrefix),
      mode: firstToken,
      spec,
    };
  }

  const matchingModes = getAvailableModes(spec).filter((mode) =>
    mode.startsWith(firstToken),
  );

  if (rest.length === 0 && matchingModes.length > 0) {
    return { kind: "modes", items: matchingModes, spec };
  }

  return {
    kind: "results",
    suggestions: getSuggestions(
      [suggestionQueryPrefix, normalizedRemaining].filter(Boolean).join(" "),
    ),
  };
}

export function resolveGridState(query: string): GridState {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return { kind: "classes", items: wowClasses };
  }

  const exactGlobalSpecMatch = getExactGlobalSpecMatch(normalizedQuery);
  if (exactGlobalSpecMatch) {
    return resolveSpecState(
      exactGlobalSpecMatch.item,
      exactGlobalSpecMatch.remainingQuery,
      getShortestSpecAlias(exactGlobalSpecMatch.item),
    );
  }

  const exactClassMatch = getExactClassMatch(normalizedQuery);
  if (exactClassMatch) {
    if (!exactClassMatch.remainingQuery) {
      return {
        kind: "specs",
        classEntry: exactClassMatch.item,
        items: getSpecGridItems(exactClassMatch.item),
      };
    }

    const exactClassScopedSpecMatch = getExactClassScopedSpecMatch(
      exactClassMatch.item,
      exactClassMatch.remainingQuery,
    );

    if (exactClassScopedSpecMatch) {
      return resolveSpecState(
        exactClassScopedSpecMatch.item,
        exactClassScopedSpecMatch.remainingQuery,
        getShortestSpecAlias(exactClassScopedSpecMatch.item),
      );
    }

    return {
      kind: "specs",
      classEntry: exactClassMatch.item,
      items: getSpecGridItems(
        exactClassMatch.item,
        exactClassMatch.remainingQuery,
      ),
    };
  }

  const matchingClasses = getMatchingClasses(normalizedQuery);
  if (matchingClasses.length > 0) {
    return { kind: "classes", items: matchingClasses };
  }

  const matchingSpecs = getGlobalSpecGridItems(normalizedQuery);
  if (matchingSpecs.length > 0) {
    return { kind: "specs", items: matchingSpecs };
  }

  return { kind: "results", suggestions: getSuggestions(query) };
}

export function getClassForSpec(spec: SpecEntry): ClassEntry {
  const classEntry = wowClasses.find((candidate) =>
    spec.slug.endsWith(`-${candidate.slug}`),
  );

  if (!classEntry) {
    throw new Error(`No class mapping found for spec slug "${spec.slug}"`);
  }

  return classEntry;
}

export function getClassIconPath(classEntry: ClassEntry): string {
  return `icons/${classEntry.representativeSpecSlug}.jpg`;
}

export function getSpecIconPath(spec: SpecEntry): string {
  return `icons/${spec.slug}.jpg`;
}

export function getShortestSpecAlias(spec: SpecEntry): string {
  return spec.aliases.reduce((shortest, alias) =>
    alias.length < shortest.length ? alias : shortest,
  );
}

export function getModeQuery(spec: SpecEntry, mode: Mode): string {
  return `${getShortestSpecAlias(spec)} ${mode}`;
}

export function getPageQuery(
  spec: SpecEntry,
  mode: Mode,
  page: PageEntry,
): string {
  const pageToken = page.aliases.find((alias) => alias !== "") ?? "guide";
  return `${getModeQuery(spec, mode)} ${pageToken}`;
}

export function getPageTitle(page: PageEntry): string {
  return (
    PAGE_TITLES[page.urlSuffix] ?? titleCase(page.urlSuffix.replace(/-/g, " "))
  );
}
