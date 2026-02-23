import { defineCommand } from "citty";
import {
  checkGhInstalled,
  checkGhAuth,
  detectRepo,
  listLabelsDetailed,
} from "../utils/gh";
import { error, info, heading } from "../utils/logger";
import pc from "picocolors";

export default defineCommand({
  meta: {
    name: "list",
    description: "List all labels in a repository",
  },
  args: {
    repo: {
      type: "string",
      alias: "r",
      description: "Target repository (owner/repo). Defaults to current repo.",
    },
  },
  async run({ args }) {
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

    info(`Target: ${repo}`);

    const labels = await listLabelsDetailed(repo);

    if (labels.length === 0) {
      info("No labels found.");
      return;
    }

    heading(`Labels (${labels.length} total)`);

    for (const label of labels) {
      const name = pc.bold(label.name.padEnd(30));
      const color = pc.dim(`#${label.color}`);
      const desc = label.description ? pc.dim(label.description) : "";
      console.log(`  ${name} ${color}  ${desc}`);
    }
  },
});
