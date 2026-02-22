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
import { filterLabels } from "../utils/filter";
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
    label: {
      type: "string",
      alias: "l",
      description:
        'Apply specific label(s) by name. Comma-separated for multiple (e.g., --label "bug,enhancement")',
    },
    category: {
      type: "string",
      alias: "c",
      description:
        'Apply labels from specific category(ies). Comma-separated for multiple (e.g., --category "type,status")',
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

    // Filter labels by --label and --category flags
    const { entries: filteredEntries, warnings } = filterLabels(labels, {
      label: args.label,
      category: args.category,
    });

    for (const w of warnings) {
      warn(w);
    }

    if (args.category) {
      info(`Applying labels from category: ${args.category}`);
    }
    if (args.label) {
      info(`Applying specific labels: ${args.label}`);
    }

    if (filteredEntries.length === 0) {
      warn("No labels matched the specified filter(s).");
      return;
    }

    const counts = { created: 0, updated: 0, skipped: 0, failed: 0 };

    for (const [category, categoryLabels] of filteredEntries) {
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
