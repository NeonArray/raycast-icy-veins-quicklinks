import { Action, ActionPanel, Image, List } from "@raycast/api";
import { useState } from "react";
import { getSuggestions } from "./utils/suggestions";
import type { Suggestion } from "./types";
import type { LaunchProps } from "@raycast/api";

interface Arguments {
  initialQuery: string;
}

export default function Command({
  arguments: args,
}: LaunchProps<{ arguments: Arguments }>) {
  const [query, setQuery] = useState(args.initialQuery ?? "");
  const suggestions = getSuggestions(query);

  const pveSuggestions = suggestions.filter((s) => s.mode === "pve");
  const pvpSuggestions = suggestions.filter((s) => s.mode === "pvp");

  return (
    <List
      searchBarPlaceholder="sp pve gear"
      onSearchTextChange={setQuery}
      searchText={query}
      filtering={false}
      isShowingDetail={false}
    >
      <List.Section title="PvE" subtitle={`${pveSuggestions.length}`}>
        {pveSuggestions.map((s) => (
          <SuggestionItem key={s.id} suggestion={s} />
        ))}
      </List.Section>
      <List.Section title="PvP" subtitle={`${pvpSuggestions.length}`}>
        {pvpSuggestions.map((s) => (
          <SuggestionItem key={s.id} suggestion={s} />
        ))}
      </List.Section>
    </List>
  );
}

function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
  return (
    <List.Item
      icon={{ source: suggestion.icon, mask: Image.Mask.RoundedRectangle }}
      title={suggestion.title}
      subtitle={suggestion.subtitle}
      accessories={[
        { text: suggestion.url.replace("https://www.icy-veins.com/wow/", "") },
      ]}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={suggestion.url} title="Open Guide" />
        </ActionPanel>
      }
    />
  );
}
