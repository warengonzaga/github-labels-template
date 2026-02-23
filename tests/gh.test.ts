import { describe, it, expect } from "bun:test";
import type { Label } from "../src/utils/gh";

describe("GH Utils", () => {
  it("should export all required functions", async () => {
    const gh = await import("../src/utils/gh");
    expect(typeof gh.checkGhInstalled).toBe("function");
    expect(typeof gh.checkGhAuth).toBe("function");
    expect(typeof gh.detectRepo).toBe("function");
    expect(typeof gh.listLabels).toBe("function");
    expect(typeof gh.listLabelsDetailed).toBe("function");
    expect(typeof gh.createLabel).toBe("function");
    expect(typeof gh.editLabel).toBe("function");
    expect(typeof gh.deleteLabel).toBe("function");
  });

  it("should correctly type a Label object", () => {
    const label: Label = {
      name: "bug",
      color: "d73a4a",
      description: "Something isn't working",
    };
    expect(label.name).toBe("bug");
    expect(label.color).toBe("d73a4a");
    expect(label.description).toBe("Something isn't working");
  });

  describe("checkGhInstalled", () => {
    it("should return a boolean", async () => {
      const { checkGhInstalled } = await import("../src/utils/gh");
      const result = await checkGhInstalled();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("listLabels", () => {
    it("should return an array for an invalid repo", async () => {
      const { listLabels } = await import("../src/utils/gh");
      const result = await listLabels("invalid/nonexistent-repo-xyz");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("listLabelsDetailed", () => {
    it("should return an empty array for an invalid repo", async () => {
      const { listLabelsDetailed } = await import("../src/utils/gh");
      const result = await listLabelsDetailed("invalid/nonexistent-repo-xyz");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("deleteLabel", () => {
    it("should return false for a nonexistent label", async () => {
      const { deleteLabel } = await import("../src/utils/gh");
      const result = await deleteLabel(
        "invalid/nonexistent-repo-xyz",
        "nonexistent-label"
      );
      expect(result).toBe(false);
    });
  });

  describe("createLabel", () => {
    it("should return false for an invalid repo", async () => {
      const { createLabel } = await import("../src/utils/gh");
      const result = await createLabel("invalid/nonexistent-repo-xyz", {
        name: "test",
        color: "000000",
        description: "test",
      });
      expect(result).toBe(false);
    });
  });
});
