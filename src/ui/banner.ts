/**
 * CLI Banner
 *
 * ASCII art logo and version display for GHLT CLI.
 * Uses a pre-rendered Slant logo for stable output across environments.
 * Displayed at the top of CLI output.
 */

import pc from "picocolors";
import pkg from "../../package.json";

const LOGO = String.raw`   ________  ____  ______
  / ____/ / / / / /_  __/
 / / __/ /_/ / /   / /
/ /_/ / __  / /___/ /
\____/_/ /_/_____/_/`;

/**
 * Get the version string from package.json
 */
export function getVersion(): string {
  return pkg.version ?? "unknown";
}

/**
 * Get the author string from package.json
 */
export function getAuthor(): string {
  return pkg.author ?? "unknown";
}

/**
 * Print the update advisory banner to stdout when a newer version is available.
 * @param latestVersion - The latest available version string (e.g. "0.9.0")
 */
export function showUpdateBanner(latestVersion: string): void {
  const current = getVersion();
  // Strip ANSI escape codes when measuring visible width for the box border
  const visibleLen = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "").length;

  const line1 = `  ${pc.bold(`Update available: v${current} → v${latestVersion}`)}  `;
  const line2 = `  Run ${pc.bold("ghlt update")} to upgrade.  `;
  const width = Math.max(visibleLen(line1), visibleLen(line2));
  const border = "─".repeat(width);

  console.log(pc.yellow(`┌${border}┐`));
  console.log(pc.yellow("│") + line1 + " ".repeat(width - visibleLen(line1)) + pc.yellow("│"));
  console.log(pc.yellow("│") + line2 + " ".repeat(width - visibleLen(line2)) + pc.yellow("│"));
  console.log(pc.yellow(`└${border}┘`));
  console.log();
}

/**
 * Print the branded banner to stdout
 * @param minimal - If true, only show logo and version (used with --help)
 */
export function showBanner(minimal = false): void {
  console.log(pc.cyan("\n" + LOGO));
  console.log();
  console.log(
    `  ${pc.white(`v${getVersion()}`)} ${pc.white("—")} ${pc.white(`Built by ${getAuthor()}`)} ${pc.white("(")}${pc.white(linkify("with Him", "https://youtu.be/VOZbswniA-g?si=pdVHNSAfZW0vQLJ7"))}${pc.white(")")}`
  );

  if (!minimal) {
    console.log();
    console.log(
      `  🤝 ${pc.white("Contribute:")} ${pc.dim(linkify("gh.waren.build/github-labels-template", "https://gh.waren.build/github-labels-template"))}`
    );
    console.log(
      `  🙏 ${pc.white("Sponsor:")} ${pc.dim(linkify("warengonzaga.com/sponsor", "https://warengonzaga.com/sponsor"))}`
    );
  }

  console.log();
}

function linkify(label: string, url: string): string {
  return `\u001B]8;;${url}\u0007${label}\u001B]8;;\u0007`;
}
