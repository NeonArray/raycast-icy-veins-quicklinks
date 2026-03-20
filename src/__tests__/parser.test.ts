import { describe, it, expect } from "vitest";
import { parse } from "../utils/parser";
import type { ParsedInput } from "../types";

// Helper to assert ok result and return the typed value
function assertOk(result: ReturnType<typeof parse>): ParsedInput {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected ok result");
  return result.value;
}

describe("parse()", () => {
  // ── Spec resolution ──────────────────────────────────────────────────────

  it('resolves shorthand alias "sp" to shadow-priest slug', () => {
    const value = assertOk(parse("sp pve gear"));
    expect(value.spec.slug).toBe("shadow-priest");
  });

  it('resolves full name "shadow priest pve gear" identically to "sp pve gear"', () => {
    const a = assertOk(parse("sp pve gear"));
    const b = assertOk(parse("shadow priest pve gear"));
    expect(b.spec.slug).toBe(a.spec.slug);
    expect(b.mode).toBe(a.mode);
    expect(b.page.aliases).toEqual(expect.arrayContaining(["gear"]));
  });

  // ── Mode defaulting ───────────────────────────────────────────────────────

  it('defaults mode to "pve" when only spec is given', () => {
    const value = assertOk(parse("sp"));
    expect(value.mode).toBe("pve");
  });

  it('defaults mode to "pve" when spec + mode token omitted', () => {
    const value = assertOk(parse("sp"));
    expect(value.mode).toBe("pve");
  });

  // ── Page defaulting ───────────────────────────────────────────────────────

  it('defaults page to guide/intro when no page token is given ("sp")', () => {
    const value = assertOk(parse("sp"));
    const hasGuideAlias = value.page.aliases.some((a) =>
      ["guide", "intro"].includes(a),
    );
    expect(hasGuideAlias).toBe(true);
  });

  it('defaults page to guide/intro for "sp pvp"', () => {
    const value = assertOk(parse("sp pvp"));
    expect(value.mode).toBe("pvp");
    const hasGuideAlias = value.page.aliases.some((a) =>
      ["guide", "intro"].includes(a),
    );
    expect(hasGuideAlias).toBe(true);
  });

  it('defaults page to guide/intro for "sp pve"', () => {
    const value = assertOk(parse("sp pve"));
    expect(value.mode).toBe("pve");
    const hasGuideAlias = value.page.aliases.some((a) =>
      ["guide", "intro"].includes(a),
    );
    expect(hasGuideAlias).toBe(true);
  });

  // ── Case insensitivity ───────────────────────────────────────────────────

  it('is case-insensitive: "SP PVE GEAR" equals "sp pve gear"', () => {
    const lower = assertOk(parse("sp pve gear"));
    const upper = assertOk(parse("SP PVE GEAR"));
    expect(upper.spec.slug).toBe(lower.spec.slug);
    expect(upper.mode).toBe(lower.mode);
    expect(upper.page.aliases).toEqual(expect.arrayContaining(["gear"]));
  });

  // ── Whitespace trimming ──────────────────────────────────────────────────

  it('trims and collapses extra whitespace: "  shadow priest  pve  gear  "', () => {
    const value = assertOk(parse("  shadow priest  pve  gear  "));
    expect(value.spec.slug).toBe("shadow-priest");
    expect(value.mode).toBe("pve");
    expect(value.page.aliases).toEqual(expect.arrayContaining(["gear"]));
  });

  // ── PvE pages ────────────────────────────────────────────────────────────

  it('"sp pve gear" resolves to pve gear/bis page', () => {
    const value = assertOk(parse("sp pve gear"));
    expect(value.mode).toBe("pve");
    expect(value.page.aliases).toEqual(expect.arrayContaining(["gear"]));
  });

  it('"sp pve leveling" resolves to leveling page', () => {
    const value = assertOk(parse("sp pve leveling"));
    expect(value.mode).toBe("pve");
    expect(value.page.aliases).toEqual(expect.arrayContaining(["leveling"]));
  });

  // ── PvP pages ────────────────────────────────────────────────────────────

  it('"sp pvp gear" resolves to pvp gear page', () => {
    const value = assertOk(parse("sp pvp gear"));
    expect(value.mode).toBe("pvp");
    const hasBisOrGear = value.page.aliases.some((a) =>
      ["gear", "bis"].includes(a),
    );
    expect(hasBisOrGear).toBe(true);
  });

  it('"sp pvp comps" resolves to pvp compositions page', () => {
    const value = assertOk(parse("sp pvp comps"));
    expect(value.mode).toBe("pvp");
    expect(value.page.aliases).toEqual(expect.arrayContaining(["comps"]));
  });

  it('"sp pvp bg" resolves to battleground blitz page', () => {
    const value = assertOk(parse("sp pvp bg"));
    expect(value.mode).toBe("pvp");
    expect(value.page.aliases).toEqual(expect.arrayContaining(["bg"]));
  });

  // ── Special / mode-agnostic pages ────────────────────────────────────────

  it('"shadow priest resources" resolves to the special resources page (no mode segment)', () => {
    const value = assertOk(parse("shadow priest resources"));
    expect(value.page.special).toBe(true);
    expect(value.page.aliases).toEqual(expect.arrayContaining(["resources"]));
  });

  it('"shadow priest pve resources" resolves to the same special resources page', () => {
    const withMode = assertOk(parse("shadow priest pve resources"));
    const withoutMode = assertOk(parse("shadow priest resources"));
    expect(withMode.page.special).toBe(true);
    expect(withMode.page.aliases).toEqual(
      expect.arrayContaining(["resources"]),
    );
    expect(withMode.page.urlSuffix).toBe(withoutMode.page.urlSuffix);
  });

  // ── Error cases ───────────────────────────────────────────────────────────

  it('returns unknown-spec error for "invalidspec pve gear"', () => {
    const result = parse("invalidspec pve gear");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error result");
    expect(result.error.kind).toBe("unknown-spec");
    expect(result.error.token.toLowerCase()).toContain("invalidspec");
  });

  it('returns unknown-page error for "sp pve invalidpage"', () => {
    const result = parse("sp pve invalidpage");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error result");
    expect(result.error.kind).toBe("unknown-page");
    expect(result.error.token.toLowerCase()).toContain("invalidpage");
  });

  // ── Edge cases flagged by QA ──────────────────────────────────────────────

  it('rejects extra tokens: "sp pve gear extra" returns unknown-page for the extra token', () => {
    const result = parse("sp pve gear extra");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error result");
    expect(result.error.kind).toBe("unknown-page");
    expect(result.error.token).toBe("extra");
  });

  it('returns unknown-spec when a bare mode word is given: "pvp"', () => {
    const result = parse("pvp");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error result");
    expect(result.error.kind).toBe("unknown-spec");
  });

  it('returns unknown-spec for partial two-word spec: "shadow"', () => {
    const result = parse("shadow");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error result");
    expect(result.error.kind).toBe("unknown-spec");
    expect(result.error.token).toBe("shadow");
  });

  it('returns unknown-page error for "sp pve invalidpage"', () => {
    const result = parse("sp pve invalidpage");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error result");
    expect(result.error.kind).toBe("unknown-page");
    expect(result.error.token.toLowerCase()).toContain("invalidpage");
  });
});
