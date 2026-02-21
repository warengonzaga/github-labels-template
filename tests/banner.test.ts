import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { showBanner, getVersion, getAuthor } from "../src/ui/banner";

describe("Banner", () => {
  describe("getVersion", () => {
    it("should return a version string", () => {
      const version = getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe("string");
      expect(version).not.toBe("unknown");
    });

    it("should match semver format", () => {
      const version = getVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe("getAuthor", () => {
    it("should return the author name", () => {
      const author = getAuthor();
      expect(author).toBeDefined();
      expect(typeof author).toBe("string");
      expect(author).not.toBe("unknown");
    });

    it("should return 'Waren Gonzaga'", () => {
      const author = getAuthor();
      expect(author).toBe("Waren Gonzaga");
    });
  });

  describe("showBanner", () => {
    let consoleSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should print the banner to console", () => {
      showBanner();
      expect(consoleSpy).toHaveBeenCalled();
      // Banner prints: logo, version/author line, empty line
      expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it("should include version in output", () => {
      showBanner();
      const allOutput = consoleSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(allOutput).toContain(getVersion());
    });

    it("should include author in output", () => {
      showBanner();
      const allOutput = consoleSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(allOutput).toContain(getAuthor());
    });
  });
});
