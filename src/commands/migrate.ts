import { defineCommand } from "citty";
import {
  checkGhInstalled,
  checkGhAuth,
  detectRepo,
  listLabels,
  deleteLabel,
  createLabel,
} from "../utils/gh";
import { success, error, warn, info, heading, summary } from "../utils/logger";
import { loadCustomLabels } from "../utils/custom-labels";
import labels from "../labels.json";
import type { Label } from "../utils/gh";
import { confirmPrompt } from "../utils/confirm";
import pc from "picocolors";

export default defineCommand({
  meta: {
    name: "migrate",
    description:
      "Wipe all existing labels and apply the template (clean slate)",
  },
  args: {
    repo: {
      type: "string",
      alias: "r",
      description: "Target repository (owner/repo). Defaults to current repo.",
    },
    yes: {
      type: "boolean",
      alias: "y",
      default: false,
      description: "Skip confirmation prompt",
    },
    custom: {
      type: "boolean",
      default: false,
      description:
        "Include custom labels from labels-custom.json (generated via ghlt generate)",
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

    // Build the label pool
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

    const templateCount = Object.values(labelPool).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    // Fetch existing labels
    const existing = await listLabels(repo);

    // Confirmation
    if (!args.yes) {
      const confirmed = await confirmPrompt(
        pc.bold(pc.yellow(`This will delete all ${existing.length} existing labels from ${repo} and apply ${templateCount} template labels.`))
      );
      if (!confirmed) return;
    }

    // Phase 1: Wipe
    const wipeCounts = { deleted: 0, failed: 0 };

    if (existing.length > 0) {
      heading("Wiping Existing Labels");

      for (const name of existing) {
        const ok = await deleteLabel(repo, name);
        if (ok) {
          success(`${name} (deleted)`);
          wipeCounts.deleted++;
        } else {
          error(`${name} (delete failed)`);
          wipeCounts.failed++;
        }
      }

      summary(wipeCounts);
    } else {
      info("No existing labels to wipe.");
    }

    // Phase 2: Apply
    const applyCounts = { created: 0, failed: 0 };

    for (const [category, categoryLabels] of Object.entries(labelPool)) {
      heading(`${category.charAt(0).toUpperCase() + category.slice(1)} Labels`);

      for (const label of categoryLabels) {
        const ok = await createLabel(repo, label);
        if (ok) {
          success(`${label.name} (created)`);
          applyCounts.created++;
        } else {
          error(`${label.name} (create failed)`);
          applyCounts.failed++;
        }
      }
    }

    summary(applyCounts);
  },
});
