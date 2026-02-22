import { describe, it, expect } from "bun:test";
import { filterLabels } from "../src/utils/filter";
import type { Label } from "../src/utils/gh";

// Use the actual labels.json for realistic testing
import labels from "../src/labels.json";

describe("filterLabels", () => {
  it("should return all labels when no filters are provided", () => {
    const result = filterLabels(labels, {});
    const totalLabels = result.entries.reduce(
      (sum, [, items]) => sum + items.length,
      0
    );
    expect(totalLabels).toBe(23);
    expect(result.entries.length).toBe(5);
    expect(result.warnings.length).toBe(0);
  });

  it("should filter by a single category", () => {
    const result = filterLabels(labels, { category: "type" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0][0]).toBe("type");
    expect(result.entries[0][1].length).toBe(6);
    expect(result.warnings.length).toBe(0);
  });

  it("should filter by multiple categories (comma-separated)", () => {
    const result = filterLabels(labels, { category: "type,status" });
    expect(result.entries.length).toBe(2);
    const categories = result.entries.map(([cat]) => cat);
    expect(categories).toContain("type");
    expect(categories).toContain("status");
    const totalLabels = result.entries.reduce(
      (sum, [, items]) => sum + items.length,
      0
    );
    expect(totalLabels).toBe(10); // 6 type + 4 status
  });

  it("should filter by a single label name", () => {
    const result = filterLabels(labels, { label: "bug" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0][0]).toBe("type");
    expect(result.entries[0][1].length).toBe(1);
    expect(result.entries[0][1][0].name).toBe("bug");
  });

  it("should filter by multiple label names across categories", () => {
    const result = filterLabels(labels, {
      label: "bug,good first issue",
    });
    expect(result.entries.length).toBe(2);
    const allNames = result.entries.flatMap(([, items]) =>
      items.map((l) => l.name)
    );
    expect(allNames).toContain("bug");
    expect(allNames).toContain("good first issue");
    expect(allNames.length).toBe(2);
  });

  it("should use union semantics when both --category and --label are provided", () => {
    // All type labels + "good first issue" from community
    const result = filterLabels(labels, {
      category: "type",
      label: "good first issue",
    });
    const allNames = result.entries.flatMap(([, items]) =>
      items.map((l) => l.name)
    );
    // Should have all 6 type labels + good first issue
    expect(allNames.length).toBe(7);
    expect(allNames).toContain("bug");
    expect(allNames).toContain("enhancement");
    expect(allNames).toContain("good first issue");
  });

  it("should warn on unknown category name", () => {
    const result = filterLabels(labels, { category: "nonexistent" });
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain('Unknown category "nonexistent"');
    expect(result.entries.length).toBe(0);
  });

  it("should warn on unknown label name", () => {
    const result = filterLabels(labels, { label: "nonexistent-label" });
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain(
      'Label "nonexistent-label" not found in the template.'
    );
    expect(result.entries.length).toBe(0);
  });

  it("should match category names case-insensitively", () => {
    const result = filterLabels(labels, { category: "Type" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0][0]).toBe("type");
    expect(result.warnings.length).toBe(0);
  });

  it("should match label names case-insensitively", () => {
    const result = filterLabels(labels, { label: "Bug" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0][1][0].name).toBe("bug");
    expect(result.warnings.length).toBe(0);
  });

  it("should ignore empty segments in comma-separated values", () => {
    const result = filterLabels(labels, { label: ",bug,,enhancement," });
    const allNames = result.entries.flatMap(([, items]) =>
      items.map((l) => l.name)
    );
    expect(allNames.length).toBe(2);
    expect(allNames).toContain("bug");
    expect(allNames).toContain("enhancement");
    expect(result.warnings.length).toBe(0);
  });

  it("should include maintainer only in community labels", () => {
    const result = filterLabels(labels, { category: "community" });
    expect(result.entries.length).toBe(1);
    const names = result.entries[0][1].map((l) => l.name);
    expect(names).toContain("good first issue");
    expect(names).toContain("help wanted");
    expect(names).toContain("maintainer only");
    expect(names).toContain("hacktoberfest");
    expect(names).toContain("hacktoberfest-accepted");
    expect(names.length).toBe(5);
  });
});
