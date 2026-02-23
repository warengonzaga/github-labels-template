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
import { loadCustomLabels } from "../utils/custom-labels";
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
    custom: {
      type: "boolean",
      default: false,
      description:
        "Include custom labels from labels-custom.json (generated via ghlt generate)",
    },
    exclude: {
      type: "string",
      alias: "e",
      description:
        'Exclude specific label(s) by name. Comma-separated for multiple (e.g., --exclude "bug,enhancement")',
    },
    "exclude-category": {
      type: "string",
      description:
        'Exclude labels from specific category(ies). Comma-separated for multiple (e.g., --exclude-category "type,status")',
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

    // Merge custom labels if --custom flag is set
    const labelPool: Record<string, Label[]> = {
      ...(labels as Record<string, Label[]>),
    };

    if (args.custom) {
      const custom = loadCustomLabels();
      const customCount = Object.values(custom).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      if (customCount > 0) {
        info(`Including ${customCount} custom label(s) from labels-custom.json`);
        for (const [cat, catLabels] of Object.entries(custom)) {
          if (!labelPool[cat]) {
            labelPool[cat] = [];
          }
          for (const label of catLabels) {
            const exists = labelPool[cat].some(
              (l) => l.name.toLowerCase() === label.name.toLowerCase()
            );
            if (!exists) {
              labelPool[cat].push(label);
            }
          }
        }
      } else {
        warn(
          "No custom labels found. Use `ghlt generate` to create custom labels."
        );
      }
    }

    // Filter labels by --label and --category flags
    const { entries: filteredEntries, warnings } = filterLabels(labelPool, {
      label: args.label,
      category: args.category,
      excludeLabel: args.exclude,
      excludeCategory: args["exclude-category"],
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
    if (args["exclude-category"]) {
      info(`Excluding categories: ${args["exclude-category"]}`);
    }
    if (args.exclude) {
      info(`Excluding labels: ${args.exclude}`);
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
