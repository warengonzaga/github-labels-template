import { defineCommand } from "citty";
import {
  checkGhInstalled,
  checkGhAuth,
  detectRepo,
  listLabelsDetailed,
} from "../utils/gh";
import { error, info, heading, summary } from "../utils/logger";
import { filterLabels } from "../utils/filter";
import labels from "../labels.json";
import type { Label } from "../utils/gh";
import pc from "picocolors";

type CheckStatus = "match" | "color-mismatch" | "desc-mismatch" | "both-mismatch" | "missing";

interface CheckResult {
  template: Label;
  category: string;
  status: CheckStatus;
  repoColor?: string;
  repoDesc?: string;
}

function statusIcon(status: CheckStatus): string {
  if (status === "match") return pc.green("✔");
  if (status === "missing") return pc.red("✘");
  return pc.yellow("~");
}

function statusLabel(status: CheckStatus, strict: boolean): string {
  switch (status) {
    case "match":
      return pc.dim("match");
    case "color-mismatch":
      return pc.yellow("color mismatch");
    case "desc-mismatch":
      return pc.yellow("description mismatch");
    case "both-mismatch":
      return pc.yellow("color + description mismatch");
    case "missing":
      return pc.red("missing");
  }
}

function isFailing(status: CheckStatus, strict: boolean): boolean {
  if (status === "missing") return true;
  if (strict && status !== "match") return true;
  return false;
}

export default defineCommand({
  meta: {
    name: "check",
    description: "Check if a repository is using the Clean Label template",
  },
  args: {
    repo: {
      type: "string",
      alias: "r",
      description: "Target repository (owner/repo). Defaults to current repo.",
    },
    category: {
      type: "string",
      alias: "c",
      description:
        'Check specific category(ies) only. Comma-separated (e.g., --category "type,status")',
    },
    strict: {
      type: "boolean",
      alias: "s",
      default: false,
      description:
        "Strict mode — also flag labels with mismatched color or description",
    },
  },
  async run({ args }) {
    // Pre-flight checks
    if (!(await checkGhInstalled())) {
      error("gh CLI is not installed. Install it from https://cli.github.com");
      process.exit(1);
    }

    if (!(await checkGhAuth())) {
      error("Not authenticated. Run `gh auth login` first.");
      process.exit(1);
    }

    const repo = args.repo || (await detectRepo());
    if (!repo) {
      error(
        "Could not detect repository. Use --repo <owner/repo> or run inside a git repo."
      );
      process.exit(1);
    }

    const strict = args.strict ?? false;

    info(`Target: ${repo}`);
    if (strict) info("Mode: strict (name + color + description)");

    // Fetch repo labels
    const repoLabels = await listLabelsDetailed(repo);
    // Build a lookup map keyed by lowercase name
    const repoMap = new Map<string, Label>(
      repoLabels.map((l) => [l.name.toLowerCase(), l])
    );

    // Resolve template labels to check (with optional category filter)
    const { entries: templateEntries } = filterLabels(labels as Record<string, Label[]>, {
      category: args.category,
    });

    // Run checks
    const results: CheckResult[] = [];

    for (const [category, categoryLabels] of templateEntries) {
      for (const tmpl of categoryLabels) {
        const existing = repoMap.get(tmpl.name.toLowerCase());

        let status: CheckStatus;
        let repoColor: string | undefined;
        let repoDesc: string | undefined;

        if (!existing) {
          status = "missing";
        } else {
          const colorMatch = existing.color.toLowerCase() === tmpl.color.toLowerCase();
          const descMatch = existing.description.trim() === tmpl.description.trim();

          if (colorMatch && descMatch) {
            status = "match";
          } else if (!colorMatch && !descMatch) {
            status = "both-mismatch";
            repoColor = existing.color;
            repoDesc = existing.description;
          } else if (!colorMatch) {
            status = "color-mismatch";
            repoColor = existing.color;
          } else {
            status = "desc-mismatch";
            repoDesc = existing.description;
          }
        }

        results.push({ template: tmpl, category, status, repoColor, repoDesc });
      }
    }

    // Group results by category and print
    const byCategory = new Map<string, CheckResult[]>();
    for (const result of results) {
      if (!byCategory.has(result.category)) byCategory.set(result.category, []);
      byCategory.get(result.category)!.push(result);
    }

    console.log("");
    for (const [category, catResults] of byCategory) {
      const catTitle = category.charAt(0).toUpperCase() + category.slice(1);
      const catFailing = catResults.filter((r) => isFailing(r.status, strict)).length;
      const catStatus = catFailing > 0
        ? pc.red(`${catFailing} issue${catFailing !== 1 ? "s" : ""}`)
        : pc.green("all good");

      console.log(`${pc.bold(catTitle)} ${pc.dim(`(${catResults.length})`)} — ${catStatus}`);

      for (const result of catResults) {
        const icon = statusIcon(result.status);
        const name = result.template.name.padEnd(28);
        const color = pc.dim(`#${result.template.color}`);
        const lbl = statusLabel(result.status, strict);

        let line = `  ${icon} ${name} ${color}  ${lbl}`;

        if (result.repoColor) {
          line += pc.dim(`  (repo: #${result.repoColor})`);
        }
        if (result.repoDesc) {
          line += pc.dim(`\n    repo desc: "${result.repoDesc}"`);
        }

        console.log(line);
      }

      console.log("");
    }

    // Tally counts
    const matched = results.filter((r) => r.status === "match").length;
    const missing = results.filter((r) => r.status === "missing").length;
    const mismatched = results.filter(
      (r) => r.status !== "match" && r.status !== "missing"
    ).length;
    const total = results.length;
    const failing = results.filter((r) => isFailing(r.status, strict)).length;

    // Summary
    const summaryObj: Parameters<typeof summary>[0] = {};
    if (matched > 0) summaryObj.created = matched;   // reuse "created" slot for "matched"
    if (mismatched > 0) summaryObj.skipped = mismatched;
    if (missing > 0) summaryObj.failed = missing;

    // Custom summary line instead of the generic one
    const matchedStr = pc.green(`${matched} matched`);
    const mismatchedStr = mismatched > 0 ? pc.yellow(`, ${mismatched} mismatched`) : "";
    const missingStr = missing > 0 ? pc.red(`, ${missing} missing`) : "";
    const scoreStr = pc.bold(`${matched}/${total}`);

    console.log(`${pc.bold("Result:")} ${scoreStr} labels matched${mismatchedStr}${missingStr}`);

    if (failing === 0) {
      console.log(
        `${pc.bold("Compatible:")} ${pc.green("✔ Yes")}${strict ? " (strict)" : ""}`
      );
    } else {
      console.log(
        `${pc.bold("Compatible:")} ${pc.red("✘ No")} — run ${pc.bold("ghlt apply")} to fix`
      );
      process.exit(1);
    }
  },
});
