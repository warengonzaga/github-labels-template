import { defineCommand } from "citty";
import {
  checkGhInstalled,
  checkGhAuth,
  detectRepo,
  listLabels,
  deleteLabel,
} from "../utils/gh";
import { success, error, info, warn, heading, summary } from "../utils/logger";
import { confirmPrompt } from "../utils/confirm";
import { filterLabels } from "../utils/filter";
import { loadCustomLabels } from "../utils/custom-labels";
import labels from "../labels.json";
import type { Label } from "../utils/gh";
import pc from "picocolors";

export default defineCommand({
  meta: {
    name: "wipe",
    description: "Remove all existing labels from a repository",
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
    label: {
      type: "string",
      alias: "l",
      description:
        'Remove specific label(s) by name. Comma-separated for multiple (e.g., --label "bug,enhancement")',
    },
    category: {
      type: "string",
      alias: "c",
      description:
        'Remove labels from specific category(ies). Comma-separated for multiple (e.g., --category "type,status")',
    },
    custom: {
      type: "boolean",
      default: false,
      description:
        "Include custom labels from labels-custom.json when using --label or --category",
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

    if (existing.length === 0) {
      info("No labels found. Nothing to wipe.");
      return;
    }

    const isSelective = !!(args.label || args.category);

    let toDelete: string[];

    if (isSelective) {
      // Build label pool (same as apply)
      const labelPool: Record<string, Label[]> = {
        ...(labels as Record<string, Label[]>),
      };

      if (args.custom) {
        const custom = loadCustomLabels();
        for (const [cat, catLabels] of Object.entries(custom)) {
          if (!labelPool[cat]) labelPool[cat] = [];
          for (const label of catLabels) {
            const exists = labelPool[cat].some(
              (l) => l.name.toLowerCase() === label.name.toLowerCase()
            );
            if (!exists) labelPool[cat].push(label);
          }
        }
      }

      const { entries: filteredEntries, warnings } = filterLabels(labelPool, {
        label: args.label,
        category: args.category,
      });

      for (const w of warnings) {
        warn(w);
      }

      if (filteredEntries.length === 0) {
        warn("No labels matched the specified filter(s).");
        return;
      }

      const existingSet = new Set(existing.map((n) => n.toLowerCase()));
      toDelete = filteredEntries
        .flatMap(([, categoryLabels]) => categoryLabels.map((l) => l.name))
        .filter((name) => existingSet.has(name.toLowerCase()));

      if (toDelete.length === 0) {
        info("None of the specified labels exist on the repo. Nothing to remove.");
        return;
      }

      if (args.label) info(`Removing specific labels: ${args.label}`);
      if (args.category) info(`Removing labels from category: ${args.category}`);
    } else {
      toDelete = existing;
    }

    // Confirmation
    if (!args.yes) {
      const message = isSelective
        ? pc.bold(pc.red(`This will delete ${toDelete.length} label(s) from ${repo}.`))
        : pc.bold(pc.red(`This will delete all ${toDelete.length} labels from ${repo}.`));
      const confirmed = await confirmPrompt(message);
      if (!confirmed) return;
    }

    heading("Deleting Labels");

    const counts = { deleted: 0, failed: 0 };

    for (const name of toDelete) {
      const ok = await deleteLabel(repo, name);
      if (ok) {
        success(`${name} (deleted)`);
        counts.deleted++;
      } else {
        error(`${name} (delete failed)`);
        counts.failed++;
      }
    }

    summary(counts);
  },
});
