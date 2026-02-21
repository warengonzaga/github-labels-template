import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";

describe("Logger", () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should export all required functions", async () => {
    const logger = await import("../src/utils/logger");
    expect(typeof logger.success).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.heading).toBe("function");
    expect(typeof logger.summary).toBe("function");
  });

  it("should export LogEngine instance", async () => {
    const logger = await import("../src/utils/logger");
    expect(logger.LogEngine).toBeDefined();
  });

  describe("heading", () => {
    it("should print a bold heading", async () => {
      const { heading } = await import("../src/utils/logger");
      heading("Test Heading");
      expect(consoleSpy).toHaveBeenCalled();
      const lastCall =
        consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      expect(String(lastCall[0])).toContain("Test Heading");
    });
  });

  describe("summary", () => {
    it("should display created counts", async () => {
      const { summary } = await import("../src/utils/logger");
      summary({ created: 5 });
      expect(consoleSpy).toHaveBeenCalled();
      const lastCall =
        consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      expect(String(lastCall[0])).toContain("5 created");
    });

    it("should display multiple counts", async () => {
      const { summary } = await import("../src/utils/logger");
      summary({ created: 3, updated: 2, skipped: 1, deleted: 4, failed: 0 });
      expect(consoleSpy).toHaveBeenCalled();
      const lastCall =
        consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      const output = String(lastCall[0]);
      expect(output).toContain("3 created");
      expect(output).toContain("2 updated");
      expect(output).toContain("1 skipped");
      expect(output).toContain("4 deleted");
    });

    it("should handle empty counts gracefully", async () => {
      const { summary } = await import("../src/utils/logger");
      expect(() => summary({})).not.toThrow();
    });

    it("should not include zero counts", async () => {
      const { summary } = await import("../src/utils/logger");
      summary({ created: 0, failed: 0 });
      const lastCall =
        consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      const output = String(lastCall[0]);
      expect(output).not.toContain("created");
      expect(output).not.toContain("failed");
    });
  });

  describe("info", () => {
    it("should call without throwing", async () => {
      const { info } = await import("../src/utils/logger");
      expect(() => info("test info message")).not.toThrow();
    });
  });

  describe("warn", () => {
    it("should call without throwing", async () => {
      const { warn } = await import("../src/utils/logger");
      expect(() => warn("test warning")).not.toThrow();
    });
  });

  describe("error", () => {
    it("should call without throwing", async () => {
      const { error } = await import("../src/utils/logger");
      expect(() => error("test error")).not.toThrow();
    });
  });

  describe("success", () => {
    it("should call without throwing", async () => {
      const { success } = await import("../src/utils/logger");
      expect(() => success("test success")).not.toThrow();
    });
  });
});
