import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpecEntry } from "../types";

// ---------------------------------------------------------------------------
// Mock @raycast/api before importing the module under test
// ---------------------------------------------------------------------------
vi.mock("@raycast/api", () => ({
  getPreferenceValues: vi.fn(),
}));

import { getPreferenceValues } from "@raycast/api";
import { getFavoriteSpecs } from "../utils/favorites";

const mockPrefs = getPreferenceValues as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("getFavoriteSpecs()", () => {
  it("returns correct SpecEntry objects for valid slugs", () => {
    mockPrefs.mockReturnValue({
      favorite1: "shadow-priest",
      favorite2: "havoc-demon-hunter",
      favorite3: "",
      favorite4: "",
      favorite5: "",
    });

    const result = getFavoriteSpecs();
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("shadow-priest");
    expect(result[1].slug).toBe("havoc-demon-hunter");
  });

  it("returns all 5 favorites when all are valid", () => {
    mockPrefs.mockReturnValue({
      favorite1: "shadow-priest",
      favorite2: "havoc-demon-hunter",
      favorite3: "blood-death-knight",
      favorite4: "windwalker-monk",
      favorite5: "restoration-druid",
    });

    const result = getFavoriteSpecs();
    expect(result).toHaveLength(5);
    const slugs = result.map((s: SpecEntry) => s.slug);
    expect(slugs).toEqual([
      "shadow-priest",
      "havoc-demon-hunter",
      "blood-death-knight",
      "windwalker-monk",
      "restoration-druid",
    ]);
  });

  // ---------------------------------------------------------------------------
  // Invalid / unknown slugs are silently filtered out
  // ---------------------------------------------------------------------------

  it("silently filters out unknown slugs", () => {
    mockPrefs.mockReturnValue({
      favorite1: "not-a-real-spec",
      favorite2: "shadow-priest",
      favorite3: "also-fake",
      favorite4: "",
      favorite5: "",
    });

    const result = getFavoriteSpecs();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("shadow-priest");
  });

  it("returns empty array when all slugs are invalid", () => {
    mockPrefs.mockReturnValue({
      favorite1: "fake1",
      favorite2: "fake2",
      favorite3: "fake3",
      favorite4: "fake4",
      favorite5: "fake5",
    });

    expect(getFavoriteSpecs()).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Empty preferences return empty array
  // ---------------------------------------------------------------------------

  it("returns empty array when all preferences are empty strings", () => {
    mockPrefs.mockReturnValue({
      favorite1: "",
      favorite2: "",
      favorite3: "",
      favorite4: "",
      favorite5: "",
    });

    expect(getFavoriteSpecs()).toHaveLength(0);
  });

  it("returns empty array when all preferences are whitespace", () => {
    mockPrefs.mockReturnValue({
      favorite1: "  ",
      favorite2: "\t",
      favorite3: " ",
      favorite4: "",
      favorite5: "",
    });

    expect(getFavoriteSpecs()).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Trims whitespace and handles casing
  // ---------------------------------------------------------------------------

  it("trims surrounding whitespace from slug values", () => {
    mockPrefs.mockReturnValue({
      favorite1: "  shadow-priest  ",
      favorite2: "",
      favorite3: "",
      favorite4: "",
      favorite5: "",
    });

    const result = getFavoriteSpecs();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("shadow-priest");
  });

  it("lowercases slugs before matching", () => {
    mockPrefs.mockReturnValue({
      favorite1: "Shadow-Priest",
      favorite2: "",
      favorite3: "",
      favorite4: "",
      favorite5: "",
    });

    const result = getFavoriteSpecs();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("shadow-priest");
  });

  // ---------------------------------------------------------------------------
  // Duplicate slugs are deduplicated
  // ---------------------------------------------------------------------------

  it("deduplicates duplicate slugs", () => {
    mockPrefs.mockReturnValue({
      favorite1: "shadow-priest",
      favorite2: "shadow-priest",
      favorite3: "havoc-demon-hunter",
      favorite4: "havoc-demon-hunter",
      favorite5: "shadow-priest",
    });

    const result = getFavoriteSpecs();
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("shadow-priest");
    expect(result[1].slug).toBe("havoc-demon-hunter");
  });
});
