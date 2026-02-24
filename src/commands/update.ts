import { defineCommand } from "citty";
import { execSync } from "child_process";
import { getVersion } from "../ui/banner";
import { fetchLatestVersion, isNewerVersion, writeCache } from "../utils/updater";
import { info, error, success } from "../utils/logger";

function detectPackageManager(): "bun" | "npm" {
  try {
    execSync("bun --version", { stdio: "ignore" });
    return "bun";
  } catch {
    return "npm";
  }
}

function getUpdateCommand(pm: "bun" | "npm"): string {
  if (pm === "bun") return "bun add -g github-labels-template";
  return "npm install -g github-labels-template";
}

export default defineCommand({
  meta: {
    name: "update",
    description: "Update ghlt to the latest published version",
  },
  args: {
    check: {
      type: "boolean",
      default: false,
      description: "Only check if an update is available without installing",
    },
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Alias for --check — report availability without updating",
    },
  },
  async run({ args }) {
    const current = getVersion();
    info(`Current version: v${current}`);

    const latest = await fetchLatestVersion();
    if (!latest) {
      error(
        "Could not fetch the latest version. Check your internet connection."
      );
      process.exit(1);
    }

    info(`Latest version:  v${latest}`);

    // Update cache with the freshly fetched version
    writeCache({ lastChecked: Date.now(), latestVersion: latest });

    if (!isNewerVersion(latest, current)) {
      success("Already on the latest version.");
      return;
    }

    if (args.check || args["dry-run"]) {
      info(`Update available: v${current} → v${latest}`);
      info(`Run 'ghlt update' to upgrade.`);
      return;
    }

    info("Updating ghlt...");

    try {
      const pm = detectPackageManager();
      const cmd = getUpdateCommand(pm);
      info(`Running: ${cmd}`);
      execSync(cmd, { stdio: "inherit" });
      success(`ghlt updated to v${latest}`);
    } catch {
      error("Update failed. Try running the update command manually:");
      console.log(`  npm install -g github-labels-template`);
      process.exit(1);
    }
  },
});
