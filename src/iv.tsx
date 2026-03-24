import { Action, ActionPanel, Grid, Image, LaunchProps } from "@raycast/api";
import { useMemo, useState } from "react";
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
  pve: "https://wow.zamimg.com/images/wow/icons/large/pvecurrency-justice.jpg",
  pvp: "https://wow.zamimg.com/images/wow/icons/large/ability_pvp_gladiatormedallion.jpg",
};

const PAGE_ICON_SOURCES = {
  battleground:
    "https://wow.zamimg.com/images/wow/icons/large/achievement_bg_winsoa.jpg",
  comp: "https://wow.zamimg.com/images/wow/icons/large/achievement_arena_2v2_7.jpg",
  gear: "https://wow.zamimg.com/images/wow/icons/large/inv_sword_04.jpg",
  gems: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_gem_variety_01.jpg",
  guide: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_book_09.jpg",
  leveling:
    "https://wow.zamimg.com/images/wow/icons/large/achievement_level_10.jpg",
  macro: "https://wow.zamimg.com/images/wow/icons/large/inv_gizmo_02.jpg",
  mythic:
    "https://wow.zamimg.com/images/wow/icons/large/achievement_challengemode_gold.jpg",
  race: "https://wow.zamimg.com/images/wow/icons/large/achievement_character_human_male.jpg",
  resource:
    "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_01.jpg",
  rotation:
    "https://wow.zamimg.com/images/wow/icons/large/ability_rogue_slicedice.jpg",
  spell:
    "https://wow.zamimg.com/images/wow/icons/large/spell_holy_magicalsentry.jpg",
  stats: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_note_01.jpg",
  talents:
    "https://wow.zamimg.com/images/wow/icons/large/ability_marksmanship.jpg",
} as const;

export default function Command({
  arguments: args,
}: LaunchProps<{ arguments: Arguments }>) {
  const [query, setQuery] = useState(args.initialQuery ?? "");
  const state = useMemo(() => resolveGridState(query), [query]);

  return (
    <Grid
      columns={5}
      fit={Grid.Fit.Contain}
      inset={Grid.Inset.Small}
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
    case "classes":
      return (
        <Grid.Section
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
  const specCount = classEntry.slug === "druid" ? "4 specs" : "3 specs";

  return (
    <Grid.Item
      content={{
        source: getClassIconPath(classEntry),
        mask: Image.Mask.RoundedRectangle,
      }}
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
      content={{
        source: getSpecIconPath(item.spec),
        mask: Image.Mask.RoundedRectangle,
      }}
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
      content={{
        source: MODE_ICON_SOURCES[mode],
        mask: Image.Mask.RoundedRectangle,
      }}
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
              page: { aliases: ["guide"], urlSuffix: defaultGuide },
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
      content={{ source: getPageIcon(page), mask: Image.Mask.RoundedRectangle }}
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
  if (
    page.urlSuffix.includes("battleground") ||
    page.urlSuffix.includes("blitz")
  )
    return PAGE_ICON_SOURCES.battleground;
  if (page.urlSuffix.includes("comp")) return PAGE_ICON_SOURCES.comp;
  if (page.urlSuffix.includes("talent") || page.urlSuffix.includes("build"))
    return PAGE_ICON_SOURCES.talents;
  if (page.urlSuffix.includes("gear") || page.urlSuffix.includes("trinkets"))
    return PAGE_ICON_SOURCES.gear;
  if (page.urlSuffix.includes("rotation")) return PAGE_ICON_SOURCES.rotation;
  if (page.urlSuffix.includes("leveling")) return PAGE_ICON_SOURCES.leveling;
  if (page.urlSuffix.includes("resource")) return PAGE_ICON_SOURCES.resource;
  if (page.urlSuffix.includes("race")) return PAGE_ICON_SOURCES.race;
  if (page.urlSuffix.includes("macro")) return PAGE_ICON_SOURCES.macro;
  if (page.urlSuffix.includes("mythic")) return PAGE_ICON_SOURCES.mythic;
  if (page.urlSuffix.includes("stat")) return PAGE_ICON_SOURCES.stats;
  if (
    page.urlSuffix.includes("gem") ||
    page.urlSuffix.includes("enchant") ||
    page.urlSuffix.includes("consumable")
  ) {
    return PAGE_ICON_SOURCES.gems;
  }
  if (page.urlSuffix.includes("spell")) return PAGE_ICON_SOURCES.spell;
  if (page.urlSuffix.includes("guide")) return PAGE_ICON_SOURCES.guide;
  return PAGE_ICON_SOURCES.guide;
}

function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
  const classEntry = getClassForSpec({
    aliases: [],
    pveRole: "",
    slug: suggestion.specSlug,
  });

  return (
    <Grid.Item
      content={{ source: suggestion.icon, mask: Image.Mask.RoundedRectangle }}
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
