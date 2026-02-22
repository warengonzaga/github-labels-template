import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, unlinkSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadCustomLabels, saveCustomLabel } from "../src/utils/custom-labels";
import type { Label } from "../src/utils/gh";

const CUSTOM_FILE = resolve(process.cwd(), "labels-custom.json");

// Clean up before and after each test
function cleanup() {
  if (existsSync(CUSTOM_FILE)) {
    unlinkSync(CUSTOM_FILE);
  }
}

describe("Custom Labels", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  describe("loadCustomLabels", () => {
    it("should return empty object when file does not exist", () => {
      const result = loadCustomLabels();
      expect(result).toEqual({});
    });

    it("should load labels from existing file", () => {
      const data = {
        type: [
          {
            name: "custom-bug",
            color: "ff0000",
            description: "[Type] A custom bug label [issues]",
          },
        ],
      };
      writeFileSync(CUSTOM_FILE, JSON.stringify(data), "utf-8");

      const result = loadCustomLabels();
      expect(result).toEqual(data);
    });

    it("should return empty object for malformed JSON", () => {
      writeFileSync(CUSTOM_FILE, "not valid json", "utf-8");
      const result = loadCustomLabels();
      expect(result).toEqual({});
    });
  });

  describe("saveCustomLabel", () => {
    it("should create file if it does not exist", () => {
      const label: Label = {
        name: "test-label",
        color: "abc123",
        description: "[Type] Test label [issues]",
      };

      saveCustomLabel("type", label);

      expect(existsSync(CUSTOM_FILE)).toBe(true);
      const content = JSON.parse(readFileSync(CUSTOM_FILE, "utf-8"));
      expect(content.type).toHaveLength(1);
      expect(content.type[0].name).toBe("test-label");
    });

    it("should append to existing category", () => {
      const label1: Label = {
        name: "label-one",
        color: "111111",
        description: "[Type] First label [issues]",
      };
      const label2: Label = {
        name: "label-two",
        color: "222222",
        description: "[Type] Second label [issues]",
      };

      saveCustomLabel("type", label1);
      saveCustomLabel("type", label2);

      const content = JSON.parse(readFileSync(CUSTOM_FILE, "utf-8"));
      expect(content.type).toHaveLength(2);
      expect(content.type[0].name).toBe("label-one");
      expect(content.type[1].name).toBe("label-two");
    });

    it("should create new category if needed", () => {
      const label: Label = {
        name: "new-area",
        color: "333333",
        description: "[Area] A new area label [issues, PRs]",
      };

      saveCustomLabel("area", label);

      const content = JSON.parse(readFileSync(CUSTOM_FILE, "utf-8"));
      expect(content.area).toHaveLength(1);
      expect(content.area[0].name).toBe("new-area");
    });

    it("should update existing label by name (case-insensitive)", () => {
      const label1: Label = {
        name: "my-label",
        color: "aaaaaa",
        description: "[Type] Original [issues]",
      };
      const label2: Label = {
        name: "my-label",
        color: "bbbbbb",
        description: "[Type] Updated [issues]",
      };

      saveCustomLabel("type", label1);
      saveCustomLabel("type", label2);

      const content = JSON.parse(readFileSync(CUSTOM_FILE, "utf-8"));
      expect(content.type).toHaveLength(1);
      expect(content.type[0].color).toBe("bbbbbb");
      expect(content.type[0].description).toBe("[Type] Updated [issues]");
    });

    it("should handle multiple categories independently", () => {
      saveCustomLabel("type", {
        name: "type-label",
        color: "111111",
        description: "[Type] A type [issues]",
      });
      saveCustomLabel("status", {
        name: "status-label",
        color: "222222",
        description: "[Status] A status [issues]",
      });

      const content = JSON.parse(readFileSync(CUSTOM_FILE, "utf-8"));
      expect(Object.keys(content)).toHaveLength(2);
      expect(content.type).toHaveLength(1);
      expect(content.status).toHaveLength(1);
    });
  });
});
