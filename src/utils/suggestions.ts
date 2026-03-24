import { specs } from "../data/specs";
import { pageMap } from "../data/pages";
import type { Mode, PageEntry, SpecEntry, Suggestion } from "../types";
import { buildUrl } from "./urlBuilder";
import { getAvailableModes } from "./gridNavigation";

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function makeSuggestion(
  spec: SpecEntry,
  mode: Mode,
  page: PageEntry,
): Suggestion {
  const specLabel = capitalize(spec.aliases[0]);
  const pageLabel = capitalize(page.aliases.find((a) => a !== "") ?? "guide");
  const title = `${specLabel} · ${pageLabel}`;

  const shortSpec = spec.aliases.reduce((a, b) =>
    a.length <= b.length ? a : b,
  );
  const shortPage = page.aliases.find((a) => a !== "");
  const subtitleParts = [shortSpec, mode];
  if (shortPage) subtitleParts.push(shortPage);
  const subtitle = subtitleParts.join(" ");

  const url = buildUrl({ spec, mode, page });

  return {
    id: `${spec.slug}-${mode}-${page.urlSuffix}`,
    title,
    subtitle,
    url,
    mode,
    specSlug: spec.slug,
    icon: `icons/${spec.slug}.jpg`,
  };
}

function getGuidePage(mode: Mode): PageEntry {
  return (
    (mode === "pve" ? pageMap.pve : pageMap.pvp).find((p) =>
      p.aliases.includes(""),
    ) ?? (mode === "pve" ? pageMap.pve : pageMap.pvp)[0]
  );
}

export function getSuggestions(query: string): Suggestion[] {
  const normalize = query.trim().toLowerCase().replace(/\s+/g, " ");
  const tokens = normalize ? normalize.split(" ") : [];

  if (tokens.length === 0) {
    return specs.flatMap((spec) =>
      getAvailableModes(spec).map((mode) =>
        makeSuggestion(spec, mode, getGuidePage(mode)),
      ),
    );
  }

  // Phase A: try exact spec match (2-token first, then 1-token)
  let spec: SpecEntry | null = null;
  let consumed = 0;

  if (tokens.length >= 2) {
    const twoToken = tokens[0] + " " + tokens[1];
    spec = specs.find((s) => s.aliases.includes(twoToken)) ?? null;
    if (spec) consumed = 2;
  }

  if (!spec) {
    spec = specs.find((s) => s.aliases.includes(tokens[0])) ?? null;
    if (spec) consumed = 1;
  }

  if (spec) {
    const remaining = tokens.slice(consumed);

    let modeFilter: Mode | null = null;
    let pagePrefix = "";

    if (remaining[0] === "pve" || remaining[0] === "pvp") {
      modeFilter = remaining[0] as Mode;
      pagePrefix = remaining.slice(1).join(" ");
    } else {
      pagePrefix = remaining.join(" ");
    }

    const modes: Mode[] = modeFilter ? [modeFilter] : getAvailableModes(spec);

    const results: Suggestion[] = [];
    for (const mode of modes) {
      const modePages = mode === "pve" ? pageMap.pve : pageMap.pvp;
      const allPages = [...modePages, ...pageMap.any];
      for (const page of allPages) {
        if (
          !pagePrefix ||
          page.aliases.some((a) => a !== "" && a.startsWith(pagePrefix))
        ) {
          results.push(makeSuggestion(spec, mode, page));
        }
      }
    }

    return results;
  }

  // Phase B: no exact spec match — try prefix matching on the full normalized query
  const matchingSpecs = specs.filter((s) =>
    s.aliases.some((a) => a.startsWith(normalize)),
  );
  return matchingSpecs.flatMap((s) =>
    getAvailableModes(s).map((mode) =>
      makeSuggestion(s, mode, getGuidePage(mode)),
    ),
  );
}
