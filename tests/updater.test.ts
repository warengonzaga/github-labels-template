import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "bun:test";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import {
  isNewerVersion,
  readCache,
  writeCache,
  checkForUpdate,
  CACHE_TTL_MS,
} from "../src/utils/updater";

const TMP_CACHE_DIR = "/tmp/ghlt-test-cache";
const TMP_CACHE_FILE = join(TMP_CACHE_DIR, "update-check.json");

beforeEach(() => {
  if (existsSync(TMP_CACHE_DIR)) rmSync(TMP_CACHE_DIR, { recursive: true });
  mkdirSync(TMP_CACHE_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TMP_CACHE_DIR)) rmSync(TMP_CACHE_DIR, { recursive: true });
});

describe("Updater", () => {
  describe("isNewerVersion", () => {
    it("returns true when latest has a higher major version", () => {
      expect(isNewerVersion("2.0.0", "1.0.0")).toBe(true);
    });

    it("returns true when latest has a higher minor version", () => {
      expect(isNewerVersion("1.1.0", "1.0.0")).toBe(true);
    });

    it("returns true when latest has a higher patch version", () => {
      expect(isNewerVersion("1.0.1", "1.0.0")).toBe(true);
    });

    it("returns false when versions are equal", () => {
      expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false);
    });

    it("returns false when current is newer than latest", () => {
      expect(isNewerVersion("1.0.0", "2.0.0")).toBe(false);
    });

    it("returns false when current patch is higher", () => {
      expect(isNewerVersion("1.0.0", "1.0.5")).toBe(false);
    });

    it("handles v-prefix in version strings", () => {
      expect(isNewerVersion("v1.1.0", "v1.0.0")).toBe(true);
      expect(isNewerVersion("v1.0.0", "v1.0.0")).toBe(false);
    });

    it("handles mixed v-prefix", () => {
      expect(isNewerVersion("v2.0.0", "1.9.9")).toBe(true);
      expect(isNewerVersion("2.0.0", "v1.9.9")).toBe(true);
    });

    it("ignores pre-release suffix when comparing", () => {
      expect(isNewerVersion("1.1.0-beta", "1.0.0")).toBe(true);
      expect(isNewerVersion("1.0.0", "1.1.0-beta")).toBe(false);
    });

    it("returns false for malformed version strings", () => {
      expect(isNewerVersion("not-a-version", "1.0.0")).toBe(false);
      expect(isNewerVersion("1.0.0", "not-a-version")).toBe(false);
    });
  });

  describe("readCache / writeCache", () => {
    it("returns null when cache file does not exist", () => {
      expect(readCache(TMP_CACHE_FILE)).toBeNull();
    });

    it("returns written cache data", () => {
      const data = { lastChecked: Date.now(), latestVersion: "1.2.3" };
      writeCache(data, TMP_CACHE_FILE);
      const result = readCache(TMP_CACHE_FILE);
      expect(result).not.toBeNull();
      expect(result!.latestVersion).toBe("1.2.3");
    });

    it("creates the cache directory if it does not exist", () => {
      rmSync(TMP_CACHE_DIR, { recursive: true });
      writeCache({ lastChecked: Date.now(), latestVersion: "1.0.0" }, TMP_CACHE_FILE);
      expect(existsSync(TMP_CACHE_FILE)).toBe(true);
    });

    it("returns null for malformed cache file", () => {
      const { writeFileSync } = require("fs");
      writeFileSync(TMP_CACHE_FILE, "not valid json");
      expect(readCache(TMP_CACHE_FILE)).toBeNull();
    });
  });

  describe("cache TTL", () => {
    it("cache is considered fresh within 24 hours", () => {
      const now = Date.now();
      const data = { lastChecked: now - CACHE_TTL_MS + 1000, latestVersion: "99.0.0" };
      writeCache(data, TMP_CACHE_FILE);
      const cache = readCache(TMP_CACHE_FILE);
      expect(cache).not.toBeNull();
      const isStale = now - cache!.lastChecked > CACHE_TTL_MS;
      expect(isStale).toBe(false);
    });

    it("cache is considered stale after 24 hours", () => {
      const now = Date.now();
      const data = { lastChecked: now - CACHE_TTL_MS - 1000, latestVersion: "99.0.0" };
      writeCache(data, TMP_CACHE_FILE);
      const cache = readCache(TMP_CACHE_FILE);
      expect(cache).not.toBeNull();
      const isStale = now - cache!.lastChecked > CACHE_TTL_MS;
      expect(isStale).toBe(true);
    });

    it("CACHE_TTL_MS is exactly 24 hours", () => {
      expect(CACHE_TTL_MS).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("checkForUpdate", () => {
    let originalCI: string | undefined;
    let originalNoUpdateNotifier: string | undefined;

    beforeEach(() => {
      originalCI = process.env.CI;
      originalNoUpdateNotifier = process.env.NO_UPDATE_NOTIFIER;
    });

    afterEach(() => {
      if (originalCI === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = originalCI;
      }
      if (originalNoUpdateNotifier === undefined) {
        delete process.env.NO_UPDATE_NOTIFIER;
      } else {
        process.env.NO_UPDATE_NOTIFIER = originalNoUpdateNotifier;
      }
    });

    it("returns null when CI=true", () => {
      process.env.CI = "true";
      expect(checkForUpdate(TMP_CACHE_FILE)).toBeNull();
    });

    it("returns null when CI=1", () => {
      process.env.CI = "1";
      expect(checkForUpdate(TMP_CACHE_FILE)).toBeNull();
    });

    it("returns null when NO_UPDATE_NOTIFIER is set", () => {
      process.env.NO_UPDATE_NOTIFIER = "1";
      expect(checkForUpdate(TMP_CACHE_FILE)).toBeNull();
    });

    it("returns null when no cache exists", () => {
      delete process.env.CI;
      delete process.env.NO_UPDATE_NOTIFIER;
      expect(checkForUpdate(TMP_CACHE_FILE)).toBeNull();
    });

    it("returns null when cached version equals current version", () => {
      const { getVersion } = require("../src/ui/banner");
      const current = getVersion();
      delete process.env.CI;
      delete process.env.NO_UPDATE_NOTIFIER;
      writeCache({ lastChecked: Date.now(), latestVersion: current }, TMP_CACHE_FILE);
      expect(checkForUpdate(TMP_CACHE_FILE)).toBeNull();
    });

    it("returns latestVersion when a newer version is cached", () => {
      delete process.env.CI;
      delete process.env.NO_UPDATE_NOTIFIER;
      writeCache({ lastChecked: Date.now(), latestVersion: "999.0.0" }, TMP_CACHE_FILE);
      expect(checkForUpdate(TMP_CACHE_FILE)).toBe("999.0.0");
    });
  });
});
