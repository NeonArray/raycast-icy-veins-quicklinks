# Icy-Veins Quicklinks — Task Tracker

Status key: `⬜ pending` · `🔄 in-progress` · `✅ qa-approved` · `❌ blocked`

## Phase 1 — Foundation

| ID | Task | Agent | Status |
|----|------|-------|--------|
| types-and-setup | Define `src/types.ts` + update `package.json` | orchestrator | ✅ qa-approved |

## Phase 2 — Tests First (TDD)

| ID | Task | Agent | Status |
|----|------|-------|--------|
| tests-data | Write tests for spec/page data tables | test automator | ✅ qa-approved |
| tests-parser | Write tests for parser | test automator | ✅ qa-approved |
| tests-url-builder | Write tests for URL builder | test automator | ✅ qa-approved |

## Phase 3 — Implementation

| ID | Task | Agent | Status |
|----|------|-------|--------|
| impl-data | Implement `src/data/specs.ts` + `src/data/pages.ts` | raycast ts expert | ✅ qa-approved |
| impl-parser | Implement `src/utils/parser.ts` | raycast ts expert | ✅ qa-approved |
| impl-url-builder | Implement `src/utils/urlBuilder.ts` | raycast ts expert | ✅ qa-approved |
| impl-command | Wire `src/iv.ts` Raycast command | raycast ts expert | ✅ qa-approved |

## Phase 4 — QA

| ID | Task | Agent | Status |
|----|------|-------|--------|
| qa-data | QA review: data tables | qa agent | ✅ qa-approved |
| qa-parser | QA review: parser (fixes applied + re-verified) | qa agent | ✅ qa-approved |
| qa-url-builder | QA review: URL builder | qa agent | ✅ qa-approved |
| qa-command | QA review: command + lint + build | qa agent | ✅ qa-approved |

## Phase 5 — Full Spec Coverage

| ID | Task | Agent | Status |
|----|------|-------|--------|
| expand-specs-tests | Add per-spec tests for all 40 specs | test automator | ✅ qa-approved |
| expand-specs-impl | Expand `src/data/specs.ts` to all 40 specs | raycast ts expert | ✅ qa-approved |
| qa-expand-specs | QA review: expanded specs | qa agent | ✅ qa-approved |

---

## Final verification

| Check | Result |
|-------|--------|
| `npm test` — 98 tests, 3 suites | ✅ |
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| All 40 specs present (13 classes) | ✅ |
| Devourer DH + Augmentation Evoker included | ✅ |
| No duplicate aliases across 40 specs | ✅ |
| Ambiguous aliases resolved (`frost dk`/`frost mage`, `hpal`/`holy priest`, etc.) | ✅ |
| `"sp pve gear"` → `.../shadow-priest-pve-dps-gear-best-in-slot` | ✅ |
| `"bdk pve"` → `.../blood-death-knight-pve-tank-guide` | ✅ |
| `"bm pve m+"` → `.../beast-mastery-hunter-pve-dps-mythic-plus-tips` | ✅ |
| `"ww pvp"` → `.../windwalker-monk-pvp-guide` | ✅ |
| `"aug pve"` → `.../augmentation-evoker-pve-dps-guide` | ✅ |

> All items marked `✅ qa-approved` were approved by the QA agent and independently verified by the orchestrator.

