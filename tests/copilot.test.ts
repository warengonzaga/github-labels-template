import { describe, it, expect } from "bun:test";
import {
  parseLabelsResponse,
  buildSystemPrompt,
  buildUserPrompt,
} from "../src/utils/copilot";

describe("Copilot Utils", () => {
  describe("parseLabelsResponse", () => {
    it("should parse a valid JSON array of labels", () => {
      const response = JSON.stringify([
        {
          name: "accessibility",
          color: "5319e7",
          description: "[Type] Accessibility improvements [issues, PRs]",
        },
        {
          name: "i18n",
          color: "0075ca",
          description: "[Type] Internationalization and localization [issues, PRs]",
        },
        {
          name: "ux",
          color: "1a7f37",
          description: "[Type] User experience improvements [issues]",
        },
      ]);

      const result = parseLabelsResponse(response);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("accessibility");
      expect(result[0].color).toBe("5319e7");
      expect(result[1].name).toBe("i18n");
      expect(result[2].name).toBe("ux");
    });

    it("should handle markdown code fences", () => {
      const response = `\`\`\`json
[
  { "name": "test", "color": "aabbcc", "description": "[Type] Test [issues]" }
]
\`\`\``;

      const result = parseLabelsResponse(response);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test");
    });

    it("should strip # from color codes", () => {
      const response = JSON.stringify([
        {
          name: "test",
          color: "#ff5500",
          description: "[Type] Test [issues]",
        },
      ]);

      const result = parseLabelsResponse(response);
      expect(result[0].color).toBe("ff5500");
    });

    it("should lowercase color codes", () => {
      const response = JSON.stringify([
        {
          name: "test",
          color: "AABBCC",
          description: "[Type] Test [issues]",
        },
      ]);

      const result = parseLabelsResponse(response);
      expect(result[0].color).toBe("aabbcc");
    });

    it("should throw on invalid color format", () => {
      const response = JSON.stringify([
        {
          name: "test",
          color: "xyz",
          description: "[Type] Test [issues]",
        },
      ]);

      expect(() => parseLabelsResponse(response)).toThrow("invalid color");
    });

    it("should throw when no JSON array found", () => {
      expect(() => parseLabelsResponse("no json here")).toThrow(
        "No JSON array found"
      );
    });

    it("should throw on missing required fields", () => {
      const response = JSON.stringify([{ name: "test" }]);
      expect(() => parseLabelsResponse(response)).toThrow("missing required fields");
    });

    it("should extract JSON array from surrounding text", () => {
      const response = `Here are the suggestions:
[
  { "name": "test", "color": "aabbcc", "description": "[Type] Test [issues]" }
]
Hope this helps!`;

      const result = parseLabelsResponse(response);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test");
    });
  });

  describe("buildSystemPrompt", () => {
    it("should include category title", () => {
      const prompt = buildSystemPrompt("type", 3);
      expect(prompt).toContain('"Type"');
      expect(prompt).toContain("[Type]");
    });

    it("should include existing labels", () => {
      const prompt = buildSystemPrompt("type", 3);
      expect(prompt).toContain("bug");
      expect(prompt).toContain("enhancement");
    });

    it("should specify the count", () => {
      const prompt = buildSystemPrompt("type", 5);
      expect(prompt).toContain("exactly 5");
    });

    it("should include relevance instruction", () => {
      const prompt = buildSystemPrompt("type", 3);
      expect(prompt).toContain("DIRECTLY match what the user is asking for");
    });

    it("should include variation hint for attempt > 1", () => {
      const prompt = buildSystemPrompt("type", 3, 2);
      expect(prompt).toContain("attempt #2");
      expect(prompt).toContain("completely different");
    });

    it("should not include variation hint for attempt 1", () => {
      const prompt = buildSystemPrompt("type", 3, 1);
      expect(prompt).not.toContain("attempt #");
    });

    it("should handle unknown categories gracefully", () => {
      const prompt = buildSystemPrompt("nonexistent", 3);
      // Should include the unknown category name
      expect(prompt).toContain("nonexistent");
      // Fallback should still produce a structurally valid prompt
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
      // It should still respect the requested count
      expect(prompt).toContain("exactly 3");
      // And should not contain obvious template errors
      expect(prompt).not.toContain("undefined");
      expect(prompt).not.toContain("null");
    });
  });

  describe("buildUserPrompt", () => {
    it("should include the description", () => {
      const prompt = buildUserPrompt("a label for tracking accessibility");
      expect(prompt).toContain("a label for tracking accessibility");
    });

    it("should include refinement feedback when provided", () => {
      const prompt = buildUserPrompt("accessibility label", "make the color blue");
      expect(prompt).toContain("accessibility label");
      expect(prompt).toContain("Refinement feedback: make the color blue");
    });

    it("should not include refinement when not provided", () => {
      const prompt = buildUserPrompt("test description");
      expect(prompt).not.toContain("Refinement");
    });

    it("should include variation hint for attempt > 1", () => {
      const prompt = buildUserPrompt("test description", undefined, 3);
      expect(prompt).toContain("attempt #3");
      expect(prompt).toContain("different suggestions");
    });

    it("should not include variation hint for attempt 1", () => {
      const prompt = buildUserPrompt("test description", undefined, 1);
      expect(prompt).not.toContain("attempt #");
    });

    it("should include both refinement and attempt hint", () => {
      const prompt = buildUserPrompt("test", "change color", 2);
      expect(prompt).toContain("Refinement feedback: change color");
      expect(prompt).toContain("attempt #2");
    });
  });
});
