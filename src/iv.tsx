import { Action, ActionPanel, Grid, LaunchProps } from "@raycast/api";
import { useMemo, useState } from "react";
import { getFavoriteSpecs } from "./utils/favorites";
import type {
  ClassEntry,
  Mode,
  PageEntry,
  SpecEntry,
  Suggestion,
} from "./types";
import { buildUrl } from "./utils/urlBuilder";
import {
  getClassForSpec,
  getClassIconPath,
  getClassSpecs,
  getModeQuery,
  getPageQuery,
  getPageTitle,
  getShortestSpecAlias,
  getSpecIconPath,
  resolveGridState,
  type GridState,
  type SpecGridItem,
} from "./utils/gridNavigation";

interface Arguments {
  initialQuery: string;
}

const MODE_ICON_SOURCES: Record<Mode, string> = {
  pve: "icons/mode-pve.jpg",
  pvp: "icons/mode-pvp.jpg",
};

const PAGE_ICON_SOURCES = {
  battleground: "icons/page-battleground.jpg",
  comp: "icons/page-comp.jpg",
  gear: "icons/page-gear.jpg",
  gems: "icons/page-gems.jpg",
  guide: "icons/page-guide.jpg",
  leveling: "icons/page-leveling.jpg",
  macro: "icons/page-macro.jpg",
  mythic: "icons/page-mythic.jpg",
  race: "icons/page-race.jpg",
  resource: "icons/page-resource.jpg",
  rotation: "icons/page-rotation.jpg",
  spell: "icons/page-spell.jpg",
  stats: "icons/page-stats.jpg",
  talents: "icons/page-talents.jpg",
} as const;

const PAGE_ICON_MAPPING: {
  patterns: string[];
  icon: keyof typeof PAGE_ICON_SOURCES;
}[] = [
  { patterns: ["battleground", "blitz"], icon: "battleground" },
  { patterns: ["comp"], icon: "comp" },
  { patterns: ["talent", "build"], icon: "talents" },
  { patterns: ["gear", "trinkets"], icon: "gear" },
  { patterns: ["rotation"], icon: "rotation" },
  { patterns: ["leveling"], icon: "leveling" },
  { patterns: ["resource"], icon: "resource" },
  { patterns: ["race"], icon: "race" },
  { patterns: ["macro"], icon: "macro" },
  { patterns: ["mythic"], icon: "mythic" },
  { patterns: ["stat"], icon: "stats" },
  { patterns: ["gem", "enchant", "consumable"], icon: "gems" },
  { patterns: ["spell"], icon: "spell" },
  { patterns: ["guide"], icon: "guide" },
];

export default function Command({
  arguments: args,
}: LaunchProps<{ arguments: Arguments }>) {
  const [query, setQuery] = useState(args.initialQuery ?? "");
  const state = useMemo(() => resolveGridState(query), [query]);

  return (
    <Grid
      columns={5}
      fit={Grid.Fit.Fill}
      inset={Grid.Inset.None}
      navigationTitle={getNavigationTitle(state)}
      searchBarPlaceholder="Pick a class or type sp pve gear"
      onSearchTextChange={setQuery}
      searchText={query}
      filtering={false}
      actions={
        <ActionPanel>
          <Action title="Reset Query" onAction={() => setQuery("")} />
        </ActionPanel>
      }
    >
      {renderGrid(state, setQuery)}
      <Grid.EmptyView
        title="No matching guides"
        description="Try a different class, spec, mode, or sub-page token."
        actions={
          <ActionPanel>
            <Action title="Reset Query" onAction={() => setQuery("")} />
          </ActionPanel>
        }
      />
    </Grid>
  );
}

function getNavigationTitle(state: GridState): string {
  switch (state.kind) {
    case "classes":
      return "Choose Class";
    case "specs":
      return state.classEntry
        ? `Choose ${state.classEntry.name} Spec`
        : "Choose Spec";
    case "modes":
      return "Choose Mode";
    case "pages":
      return `Choose ${state.mode.toUpperCase()} Page`;
    case "results":
      return "Matching Guides";
  }
}

function renderGrid(
  state: GridState,
  setQuery: (value: string) => void,
): JSX.Element | JSX.Element[] {
  switch (state.kind) {
    case "classes": {
      const favoriteSpecs = getFavoriteSpecs();
      const favSection =
        favoriteSpecs.length > 0 ? (
          <Grid.Section
            key="favorites"
            title="Favorites"
            subtitle={`${favoriteSpecs.length}`}
            columns={5}
          >
            {favoriteSpecs.map((spec) => {
              const classEntry = getClassForSpec(spec);
              const item: SpecGridItem = {
                classEntry,
                name: spec.slug
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")
                  .replace(
                    new RegExp(`\\s+${classEntry.name}$`, "i"),
                    ` ${classEntry.name}`,
                  ),
                spec,
              };
              return (
                <SpecItem
                  key={spec.slug}
                  item={item}
                  onSelect={() => setQuery(getShortestSpecAlias(spec))}
                />
              );
            })}
          </Grid.Section>
        ) : null;

      const classSection = (
        <Grid.Section
          key="classes"
          title="Classes"
          subtitle={`${state.items.length}`}
          columns={5}
        >
          {state.items.map((classEntry) => (
            <ClassItem
              key={classEntry.slug}
              classEntry={classEntry}
              onSelect={() => setQuery(classEntry.aliases[0])}
            />
          ))}
        </Grid.Section>
      );

      return favSection ? [favSection, classSection] : classSection;
    }
    case "specs":
      return (
        <Grid.Section
          title={state.classEntry ? state.classEntry.name : "Specs"}
          subtitle={`${state.items.length}`}
          columns={5}
        >
          {state.items.map((item) => (
            <SpecItem
              key={item.spec.slug}
              item={item}
              onSelect={() => setQuery(getShortestSpecAlias(item.spec))}
            />
          ))}
        </Grid.Section>
      );
    case "modes":
      return (
        <Grid.Section
          title="Modes"
          subtitle={`${state.items.length}`}
          columns={4}
        >
          {state.items.map((mode) => (
            <ModeItem
              key={mode}
              mode={mode}
              spec={state.spec}
              onSelect={() => setQuery(getModeQuery(state.spec, mode))}
            />
          ))}
        </Grid.Section>
      );
    case "pages":
      return (
        <Grid.Section
          title={`${getShortestSpecAlias(state.spec).toUpperCase()} ${state.mode.toUpperCase()}`}
          subtitle={`${state.items.length}`}
          columns={5}
        >
          {state.items.map((page) => (
            <PageItem
              key={`${state.spec.slug}-${state.mode}-${page.urlSuffix}`}
              mode={state.mode}
              page={page}
              setQuery={setQuery}
              spec={state.spec}
            />
          ))}
        </Grid.Section>
      );
    case "results": {
      const pveSuggestions = state.suggestions.filter((s) => s.mode === "pve");
      const pvpSuggestions = state.suggestions.filter((s) => s.mode === "pvp");

      return [
        <Grid.Section
          key="pve"
          title="PvE"
          subtitle={`${pveSuggestions.length}`}
          columns={5}
        >
          {pveSuggestions.map((suggestion) => (
            <SuggestionItem key={suggestion.id} suggestion={suggestion} />
          ))}
        </Grid.Section>,
        <Grid.Section
          key="pvp"
          title="PvP"
          subtitle={`${pvpSuggestions.length}`}
          columns={5}
        >
          {pvpSuggestions.map((suggestion) => (
            <SuggestionItem key={suggestion.id} suggestion={suggestion} />
          ))}
        </Grid.Section>,
      ];
    }
  }
}

function ClassItem({
  classEntry,
  onSelect,
}: {
  classEntry: ClassEntry;
  onSelect: () => void;
}) {
  const specCount = `${getClassSpecs(classEntry).length} specs`;

  return (
    <Grid.Item
      content={getClassIconPath(classEntry)}
      title={classEntry.name}
      subtitle={specCount}
      keywords={classEntry.aliases}
      actions={
        <ActionPanel>
          <Action title={`Choose ${classEntry.name}`} onAction={onSelect} />
        </ActionPanel>
      }
    />
  );
}

function SpecItem({
  item,
  onSelect,
}: {
  item: SpecGridItem;
  onSelect: () => void;
}) {
  return (
    <Grid.Item
      content={getSpecIconPath(item.spec)}
      title={item.name}
      subtitle={item.classEntry.name}
      keywords={item.spec.aliases}
      actions={
        <ActionPanel>
          <Action title={`Choose ${item.name}`} onAction={onSelect} />
        </ActionPanel>
      }
    />
  );
}

function ModeItem({
  mode,
  spec,
  onSelect,
}: {
  mode: Mode;
  spec: SpecEntry;
  onSelect: () => void;
}) {
  const defaultGuide = mode === "pve" ? "guide" : "pvp-guide";

  return (
    <Grid.Item
      content={MODE_ICON_SOURCES[mode]}
      title={mode.toUpperCase()}
      subtitle={getShortestSpecAlias(spec)}
      actions={
        <ActionPanel>
          <Action title={`Choose ${mode.toUpperCase()}`} onAction={onSelect} />
          <Action.OpenInBrowser
            title={`Open ${mode.toUpperCase()} Guide`}
            url={buildUrl({
              spec,
              mode,
              page: {
                aliases: ["guide"],
                urlSuffix: defaultGuide,
                displayTitle: "Guide",
              },
            })}
          />
        </ActionPanel>
      }
    />
  );
}

function PageItem({
  mode,
  page,
  setQuery,
  spec,
}: {
  mode: Mode;
  page: PageEntry;
  setQuery: (value: string) => void;
  spec: SpecEntry;
}) {
  const query = getPageQuery(spec, mode, page);
  const title = getPageTitle(page);
  const url = buildUrl({ spec, mode, page });

  return (
    <Grid.Item
      content={getPageIcon(page)}
      title={title}
      subtitle={query}
      keywords={page.aliases.filter((alias) => alias !== "")}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={url} title={`Open ${title}`} />
          <Action title="Fill Query" onAction={() => setQuery(query)} />
        </ActionPanel>
      }
    />
  );
}

function getPageIcon(page: PageEntry): string {
  const match = PAGE_ICON_MAPPING.find(({ patterns }) =>
    patterns.some((p) => page.urlSuffix.includes(p)),
  );
  return PAGE_ICON_SOURCES[match?.icon ?? "guide"];
}

function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
  const classEntry = getClassForSpec({
    aliases: [],
    pveRole: "",
    slug: suggestion.specSlug,
  });

  return (
    <Grid.Item
      content={suggestion.icon}
      title={suggestion.title}
      subtitle={suggestion.subtitle}
      accessory={{
        tooltip: classEntry.name,
        icon: MODE_ICON_SOURCES[suggestion.mode],
      }}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={suggestion.url} title="Open Guide" />
        </ActionPanel>
      }
    />
  );
}
