import { defineCommand } from "citty";
import {
  checkGhInstalled,
  checkGhAuth,
  detectRepo,
  listLabels,
  deleteLabel,
} from "../utils/gh";
import { success, error, info, heading, summary } from "../utils/logger";
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

    // Confirmation
    if (!args.yes) {
      console.log(
        `\n${pc.bold(pc.red(`This will delete all ${existing.length} labels from ${repo}.`))}`
      );
      process.stdout.write(`${pc.dim("Continue? [y/N] ")}`);

      const response = await new Promise<string>((resolve) => {
        process.stdin.setEncoding("utf-8");
        process.stdin.once("data", (data) => resolve(data.toString().trim()));
        process.stdin.resume();
      });

      if (response.toLowerCase() !== "y") {
        info("Aborted.");
        return;
      }
    }

    heading("Deleting Labels");

    const counts = { deleted: 0, failed: 0 };

    for (const name of existing) {
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
