/**
 * CLI Banner
 *
 * ASCII art logo and version display for GHLT CLI.
 * Uses figlet with ANSI Shadow font for a modern look.
 * Displayed at the top of CLI output.
 */

import figlet from "figlet";
import pc from "picocolors";
import pkg from "../../package.json";

// Generate the logo at module load time (synchronous, fast)
let LOGO: string;
try {
  LOGO = figlet.textSync("GHLT", { font: "ANSI Shadow" });
} catch {
  // Fallback if figlet font not available
  LOGO =
    ` ██████╗ ██╗  ██╗██╗     ████████╗\n` +
    `██╔════╝ ██║  ██║██║     ╚══██╔══╝\n` +
    `██║  ███╗███████║██║        ██║   \n` +
    `██║   ██║██╔══██║██║        ██║   \n` +
    `╚██████╔╝██║  ██║███████╗   ██║   \n` +
    ` ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   `;
}

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
 * Print the branded banner to stdout
 * @param minimal - If true, only show logo and version (used with --help)
 */
export function showBanner(minimal = false): void {
  console.log(pc.cyan("\n" + LOGO));
  console.log(
    `  ${pc.dim("v" + getVersion())} ${pc.dim("—")} ${pc.dim("Built by " + getAuthor())}`
  );

  if (!minimal) {
    console.log(
      `  ${pc.dim(pkg.description)}`
    );
    console.log();
    console.log(
      `  ${pc.yellow("Star")}        ${pc.cyan("https://gh.waren.build/github-labels-template")}`
    );
    console.log(
      `  ${pc.green("Contribute")}  ${pc.cyan("https://gh.waren.build/github-labels-template/blob/main/CONTRIBUTING.md")}`
    );
    console.log(
      `  ${pc.magenta("Sponsor")}     ${pc.cyan("https://warengonzaga.com/sponsor")}`
    );
  }

  console.log();
}
