import type { PageMap } from "../types";

export const pageMap: PageMap = {
  pve: [
    { urlSuffix: "guide", aliases: ["", "intro", "guide"] },
    { urlSuffix: "leveling-guide", aliases: ["leveling"], special: true },
    { urlSuffix: "easy-mode", aliases: ["easy"] },
    {
      urlSuffix: "spec-builds-talents",
      aliases: ["build", "talent", "talents"],
    },
    {
      urlSuffix: "rotation-cooldowns-abilities",
      aliases: ["rotation", "cooldowns", "abilities"],
    },
    { urlSuffix: "stat-priority", aliases: ["stats", "priority"] },
    {
      urlSuffix: "gems-enchants-consumables",
      aliases: ["gems", "enchants", "consumables"],
    },
    { urlSuffix: "gear-best-in-slot", aliases: ["gear", "bis"] },
    { urlSuffix: "mythic-plus-tips", aliases: ["m+", "mythic", "tips"] },
    { urlSuffix: "spell-summary", aliases: ["spells", "glossary"] },
  ],
  pvp: [
    { urlSuffix: "pvp-guide", aliases: ["", "intro", "guide"] },
    {
      urlSuffix: "pvp-talents-and-builds",
      aliases: ["build", "talent", "talents"],
    },
    {
      urlSuffix: "pvp-stat-priority-gear-and-trinkets",
      aliases: ["gear", "bis"],
    },
    {
      urlSuffix: "pvp-rotation-and-playstyle",
      aliases: ["rotation", "cooldowns", "abilities"],
    },
    {
      urlSuffix: "battleground-blitz-pvp-guide",
      aliases: ["bg", "battleground", "blitz"],
    },
    {
      urlSuffix: "pvp-best-arena-compositions",
      aliases: ["comps", "comp", "compositions"],
    },
    { urlSuffix: "pvp-useful-macros", aliases: ["macros"] },
    { urlSuffix: "pvp-best-races-and-racials", aliases: ["races"] },
  ],
  any: [{ urlSuffix: "resources", aliases: ["resources"], special: true }],
};
