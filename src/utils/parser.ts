import { specs } from "../data/specs";
import { pageMap } from "../data/pages";
import type { ParseResult, Mode } from "../types";

export function parse(query: string): ParseResult {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  const tokens = normalized.split(" ").filter(Boolean);

  if (tokens.length === 0) {
    return { ok: false, error: { kind: "unknown-spec", token: "" } };
  }

  // Try to match spec: 2-token first, then 1-token
  let spec = null;
  let specTokenCount = 0;

  const twoToken = tokens.length >= 2 ? tokens[0] + " " + tokens[1] : null;
  if (twoToken) {
    spec = specs.find((s) => s.aliases.includes(twoToken)) ?? null;
    if (spec) specTokenCount = 2;
  }

  if (!spec) {
    spec = specs.find((s) => s.aliases.includes(tokens[0])) ?? null;
    if (spec) specTokenCount = 1;
  }

  if (!spec) {
    return { ok: false, error: { kind: "unknown-spec", token: tokens[0] } };
  }

  let remaining = tokens.slice(specTokenCount);

  // Detect optional mode token
  let mode: Mode = "pve";
  if (remaining[0] === "pve" || remaining[0] === "pvp") {
    mode = remaining[0] as Mode;
    remaining = remaining.slice(1);
  }

  // Detect optional page token
  const pageToken = remaining[0];
  const extraToken = remaining[1];

  if (!pageToken) {
    // Default to guide/intro page (alias "")
    const defaultPage =
      pageMap[mode].find((p) => p.aliases.includes("")) ?? pageMap[mode][0];
    return { ok: true, value: { spec, mode, page: defaultPage } };
  }

  // Reject unrecognised tokens that appear after the page token
  if (extraToken !== undefined) {
    return { ok: false, error: { kind: "unknown-page", token: extraToken } };
  }

  // Check pageMap.any first (mode-agnostic pages like resources)
  const anyPage = pageMap.any.find((p) => p.aliases.includes(pageToken));
  if (anyPage) {
    return { ok: true, value: { spec, mode, page: anyPage } };
  }

  // Then check mode-specific pages
  const modePage = pageMap[mode].find((p) => p.aliases.includes(pageToken));
  if (modePage) {
    return { ok: true, value: { spec, mode, page: modePage } };
  }

  return { ok: false, error: { kind: "unknown-page", token: pageToken } };
}
