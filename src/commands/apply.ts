import { defineCommand } from "citty";
import {
  checkGhInstalled,
  checkGhAuth,
  detectRepo,
  listLabels,
  createLabel,
  editLabel,
} from "../utils/gh";
import { success, error, warn, info, heading, summary } from "../utils/logger";
import labels from "../labels.json";
import type { Label } from "../utils/gh";

export default defineCommand({
  meta: {
    name: "apply",
    description: "Apply labels from the template to a repository",
  },
  args: {
    repo: {
      type: "string",
      alias: "r",
      description: "Target repository (owner/repo). Defaults to current repo.",
    },
    force: {
      type: "boolean",
      alias: "f",
      default: false,
      description: "Overwrite existing labels with the same name",
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

    // Resolve target repo
    const repo = args.repo || (await detectRepo());
    if (!repo) {
      error(
        "Could not detect repository. Use --repo <owner/repo> or run inside a git repo."
      );
      process.exit(1);
    }

    info(`Target: ${repo}`);

    // Fetch existing labels
    const existing = await listLabels(repo);
    const existingSet = new Set(existing.map((n) => n.toLowerCase()));

    // Flatten all template labels
    const allLabels: Label[] = Object.entries(labels).flatMap(
      ([, categoryLabels]) => categoryLabels
    );

    const counts = { created: 0, updated: 0, skipped: 0, failed: 0 };

    for (const [category, categoryLabels] of Object.entries(labels)) {
      heading(`${category.charAt(0).toUpperCase() + category.slice(1)} Labels`);

      for (const label of categoryLabels) {
        const exists = existingSet.has(label.name.toLowerCase());

        if (exists && args.force) {
          const ok = await editLabel(repo, label);
          if (ok) {
            success(`${label.name} (updated)`);
            counts.updated++;
          } else {
            error(`${label.name} (update failed)`);
            counts.failed++;
          }
        } else if (exists) {
          warn(`${label.name} (already exists, use --force to update)`);
          counts.skipped++;
        } else {
          const ok = await createLabel(repo, label);
          if (ok) {
            success(`${label.name} (created)`);
            counts.created++;
          } else {
            error(`${label.name} (create failed)`);
            counts.failed++;
          }
        }
      }
    }

    summary(counts);
  },
});
