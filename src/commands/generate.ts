import { defineCommand } from "citty";
import { select, input, confirm } from "@inquirer/prompts";
import {
  checkGhInstalled,
  checkGhAuth,
  detectRepo,
  createLabel,
} from "../utils/gh";
import {
  generateLabels,
  checkCopilotAvailable,
} from "../utils/copilot";
import { saveCustomLabel } from "../utils/custom-labels";
import { success, error, warn, info, heading, summary } from "../utils/logger";
import type { Label } from "../utils/gh";
import pc from "picocolors";

const CATEGORIES = [
  { name: "type", value: "type", description: "Classify what kind of work this is" },
  { name: "status", value: "status", description: "Track the current workflow state" },
  { name: "community", value: "community", description: "Signals for open source contributors" },
  { name: "resolution", value: "resolution", description: "Why an issue or PR was closed" },
  { name: "area", value: "area", description: "Broad software layers" },
];

function formatLabelChoice(label: Label, index: number): string {
  return `${pc.bold(label.name)} ${pc.dim(`#${label.color}`)} — ${label.description}`;
}

export default defineCommand({
  meta: {
    name: "generate",
    description:
      "Generate custom labels using AI (requires GitHub Copilot subscription)",
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
        "Pre-select a category (type, status, community, resolution, area)",
    },
    model: {
      type: "string",
      alias: "m",
      description:
        "Copilot model to use (e.g., gpt-4.1, claude-sonnet-4). Defaults to your Copilot config.",
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

    info("Checking GitHub Copilot availability...");
    const copilotError = await checkCopilotAvailable();
    if (copilotError) {
      error(copilotError);
      process.exit(1);
    }
    success("GitHub Copilot is ready.");

    // Step 1: Category selection
    let category = args.category;

    if (category) {
      const valid = CATEGORIES.some((c) => c.value === category!.toLowerCase());
      if (!valid) {
        error(
          `Unknown category "${category}". Valid categories: ${CATEGORIES.map((c) => c.value).join(", ")}`
        );
        process.exit(1);
      }
      category = category.toLowerCase();
    } else {
      category = await select({
        message: "Select a label category:",
        choices: CATEGORIES.map((c) => ({
          name: `${pc.bold(c.name)} — ${pc.dim(c.description)}`,
          value: c.value,
        })),
      });
    }

    heading(`Generating ${category} label`);

    if (args.model) {
      info(`Using model: ${args.model}`);
    }

    // Step 2: Description input
    const description = await input({
      message: "Describe the label you need:",
      validate: (value) =>
        value.trim().length > 0 || "Please provide a description.",
    });

    // Step 3: Generation + selection loop
    let selectedLabel: Label | null = null;
    let refinement: string | undefined;
    let attempt = 1;

    while (!selectedLabel) {
      info(
        refinement
          ? "Regenerating with your feedback..."
          : "Generating label suggestions..."
      );

      let suggestions: Label[];
      try {
        suggestions = await generateLabels({
          category,
          description,
          count: 3,
          refinement,
          model: args.model,
          attempt,
        });
      } catch (err) {
        error(
          `Failed to generate labels: ${err instanceof Error ? err.message : String(err)}`
        );
        const retry = await confirm({
          message: "Would you like to try again?",
          default: true,
        });
        if (retry) {
          refinement = undefined;
          attempt = 1;
          continue;
        }
        return;
      }

      if (suggestions.length === 0) {
        warn("No valid suggestions received. Let's try again.");
        continue;
      }

      // Display suggestions
      console.log("");
      for (let i = 0; i < suggestions.length; i++) {
        console.log(
          `  ${pc.bold(pc.cyan(`[${i + 1}]`))} ${formatLabelChoice(suggestions[i], i)}`
        );
      }
      console.log("");

      // Build selection choices
      const choices = [
        ...suggestions.map((label, i) => ({
          name: `${label.name} — ${label.description}`,
          value: `pick:${i}`,
        })),
        {
          name: `${pc.yellow("Refine suggestions")}`,
          value: "refine",
        },
        {
          name: `${pc.blue("Regenerate")}`,
          value: "regenerate",
        },
      ];

      const choice = await select({
        message: "Pick a label or refine:",
        choices,
      });

      if (choice === "refine") {
        refinement = await input({
          message: "What would you like to change?",
          validate: (value) =>
            value.trim().length > 0 || "Please provide feedback.",
        });
        attempt++;
        continue;
      }

      if (choice === "regenerate") {
        refinement = undefined;
        attempt++;
        continue;
      }

      // User picked a label
      const pickIndex = parseInt(choice.replace("pick:", ""), 10);
      if (Number.isNaN(pickIndex) || pickIndex < 0 || pickIndex >= suggestions.length) {
        error("Invalid selection. Please pick one of the listed labels.");
        continue;
      }
      selectedLabel = suggestions[pickIndex];
    }

    // Step 4: Save to labels-custom.json
    heading("Saving Label");
    saveCustomLabel(category, selectedLabel);
    success(
      `Saved "${selectedLabel.name}" to labels-custom.json under [${category}]`
    );

    // Step 5: Optional apply to repo
    const shouldApply = await confirm({
      message: "Apply this label to a repo now?",
      default: false,
    });

    if (shouldApply) {
      const repo = args.repo || (await detectRepo());
      if (!repo) {
        error(
          "Could not detect repository. Use --repo <owner/repo> or run inside a git repo."
        );
        return;
      }

      info(`Target: ${repo}`);
      const ok = await createLabel(repo, selectedLabel);
      if (ok) {
        success(`${selectedLabel.name} (created)`);
      } else {
        error(`${selectedLabel.name} (create failed)`);
      }
    }

    console.log("");
    info(
      `Tip: Use ${pc.bold("ghlt apply --custom")} to apply all your custom labels.`
    );
  },
});
