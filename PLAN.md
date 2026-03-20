# Icy-Veins Quicklinks Implementation Plan

## Problem

Build the Raycast `iv` command so a user can enter a WoW spec or shorthand, an optional `pve`/`pvp` mode, and an optional sub-page, then be taken to the matching Icy Veins page.

The repository already has a single `no-view` command configured in `package.json` and a placeholder `src\iv.ts`, so the implementation should fit that shape instead of introducing a larger UI structure unless the existing Raycast input model proves insufficient.

## Proposed Approach

Use a small, typed, data-driven architecture:

1. Confirm how the existing Raycast `no-view` command should receive user input.
2. Define declarative mappings for spec aliases, page aliases, and URL patterns.
3. Implement a parser that normalizes shorthand like `sp`, resolves defaults, and rejects invalid or ambiguous input clearly.
4. Implement a URL builder that handles standard PVE/PVP routes plus any special-case pages such as `resources`.
5. Wire `src\iv.ts` to parse input, open the resolved URL, and surface friendly Raycast feedback on failure.
6. Validate with the existing `lint` and `build` scripts plus representative requirement examples.

This plan was chosen because it best matches the current repo layout, keeps the logic testable, and avoids hard-coding URL logic directly into the command handler.

## Chosen Plan Details

### Command behavior

- Input shape: `<spec-or-shorthand> [pve|pvp] [sub-page]`
- Default mode: `pve`
- Default page: guide/intro
- Successful resolution: open the target Icy Veins URL
- Failed resolution: show a clear Raycast error message describing the invalid token or ambiguity

### File-level plan

- `src\iv.ts`
  - Main Raycast command entry point
  - Reads input, invokes parser and URL builder, opens the URL, and handles user feedback

- `src\types.ts`
  - Shared types for modes, parsed input, spec definitions, and page definitions

- `src\data\specs.ts`
  - Typed mapping of supported specs and accepted aliases/shorthands

- `src\data\pages.ts`
  - Typed mapping of PVE and PVP page aliases to URL suffixes

- `src\utils\parser.ts`
  - Token normalization and resolution of spec, mode, and page

- `src\utils\urlBuilder.ts`
  - Final URL construction and special-case handling

### Implementation sequence

1. Inspect the Raycast API pattern needed for the current `no-view` command input path.
2. Build the spec alias table around canonical slugs such as `shadow-priest`.
3. Build the PVE and PVP page alias tables from `requirements.md`.
4. Implement parsing rules for:
   - full names like `shadow priest`
   - shorthand like `sp`
   - omitted mode
   - omitted page
5. Implement URL generation from normalized input.
6. Wire the main command and error states.
7. Run `npm run lint` and `npm run build`.
8. Manually verify example routes like `iv sp pve gear`.

## Key Notes and Considerations

- The requirements only show Shadow Priest examples, so the implementation should centralize route patterns and alias handling so the rest of the specs can be added consistently.
- Some URLs in `requirements.md` appear to contain formatting mistakes, so the implementation should treat the document as intent while validating actual route patterns during build/test work.
- `resources` may need special-case handling because its URL pattern differs from standard PVE/PVP guide routes.
- Ambiguous inputs should not silently guess when multiple interpretations are plausible.
- Keep the command logic thin; most behavior should live in typed helpers and data tables.

## Status: Complete ✅

All phases implemented, tested, and QA-approved. 98 tests passing, build clean, lint clean.

## What was built

- `src/types.ts` — shared types
- `src/data/specs.ts` — all 40 WoW specs across 13 classes with unique aliases
- `src/data/pages.ts` — PVE/PVP/any page → URL suffix mappings
- `src/utils/parser.ts` — input parser (normalise → spec → mode → page)
- `src/utils/urlBuilder.ts` — URL construction
- `src/iv.ts` — Raycast no-view command
- `src/__tests__/` — 98 tests across 3 suites

## Supported specs

All 13 classes: Death Knight, Demon Hunter (incl. Devourer), Druid, Evoker (incl. Augmentation),
Hunter, Mage, Monk, Paladin, Priest, Rogue, Shaman, Warlock, Warrior — 40 specs total.
