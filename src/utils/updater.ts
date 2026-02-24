/**
 * Update Checker Utilities
 *
 * Handles version comparison, caching, and update notifications for the GHLT CLI.
 * Uses a local cache file (~/.ghlt/update-check.json) with a 24h TTL to avoid
 * hitting the npm registry on every run.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "fs";
import { join, dirname } from "path";
import { homedir, tmpdir } from "os";
import { getVersion } from "../ui/banner";

export const CACHE_DIR = join(homedir(), ".ghlt");
export const CACHE_FILE = join(CACHE_DIR, "update-check.json");
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const REGISTRY_URL =
  "https://registry.npmjs.org/github-labels-template/latest";

export interface UpdateCache {
  lastChecked: number;
  latestVersion: string;
}

/**
 * Compare two semver strings. Returns true if `latest` is strictly newer than `current`.
 * Pre-release and build-metadata suffixes (e.g. "-beta", "+build") are stripped before
 * comparison so that "1.0.0-beta" is treated as "1.0.0".
 */
export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^v/, "")
      .split(/[-+]/)[0] // strip pre-release / build-metadata suffixes
      .split(".")
      .map(Number);
  const [lMaj, lMin, lPatch] = parse(latest);
  const [cMaj, cMin, cPatch] = parse(current);
  // Guard against malformed strings that produce NaN
  if ([lMaj, lMin, lPatch, cMaj, cMin, cPatch].some(isNaN)) return false;
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPatch > cPatch;
}

/**
 * Read the update cache file. Returns null if missing or unreadable.
 */
export function readCache(cacheFile = CACHE_FILE): UpdateCache | null {
  try {
    if (!existsSync(cacheFile)) return null;
    const raw = readFileSync(cacheFile, "utf-8");
    return JSON.parse(raw) as UpdateCache;
  } catch {
    return null;
  }
}

/**
 * Write to the update cache file using an atomic temp-file + rename to prevent
 * data corruption if two CLI processes run concurrently. Silently ignores errors.
 */
export function writeCache(data: UpdateCache, cacheFile = CACHE_FILE): void {
  try {
    const dir = dirname(cacheFile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmp = join(tmpdir(), `ghlt-update-${process.pid}-${Date.now()}.json`);
    writeFileSync(tmp, JSON.stringify(data), "utf-8");
    renameSync(tmp, cacheFile);
  } catch {
    // Cache is best-effort — silently fail
  }
}

/**
 * Fetch the latest published version from the npm registry.
 * Returns null on network error or unexpected response.
 */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch (err) {
    console.debug("Failed to fetch latest version from npm registry:", err);
    return null;
  }
}

/**
 * Kick off a background cache refresh without blocking the caller.
 * Writes the fetched version (and current timestamp) to the cache file.
 */
export function refreshCacheInBackground(cacheFile = CACHE_FILE): void {
  fetchLatestVersion()
    .then((version) => {
      if (version) {
        writeCache({ lastChecked: Date.now(), latestVersion: version }, cacheFile);
      }
    })
    .catch(() => {
      // Silently discard network errors
    });
}

/**
 * Check whether a newer version is available.
 *
 * - Reads from the local cache (synchronous, fast).
 * - If the cache is stale (> 24 h), starts a background refresh.
 * - Returns the latest version string when an update is available, or null.
 *
 * Suppressed when:
 *   - Running in a CI environment (`CI=true` or `CI=1`)
 *   - `NO_UPDATE_NOTIFIER` env var is set
 *   - `--no-update-notifier` flag is passed on the CLI
 */
export function checkForUpdate(cacheFile = CACHE_FILE): string | null {
  if (process.env.CI === "true" || process.env.CI === "1") return null;
  if (process.env.NO_UPDATE_NOTIFIER) return null;
  if (process.argv.includes("--no-update-notifier")) return null;

  const cache = readCache(cacheFile);
  const now = Date.now();
  const isStale = !cache || now - cache.lastChecked > CACHE_TTL_MS;

  if (isStale) {
    refreshCacheInBackground(cacheFile);
  }

  if (cache?.latestVersion && isNewerVersion(cache.latestVersion, getVersion())) {
    return cache.latestVersion;
  }

  return null;
}
