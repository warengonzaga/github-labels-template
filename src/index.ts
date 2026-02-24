#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import apply from "./commands/apply";
import wipe from "./commands/wipe";
import generate from "./commands/generate";
import migrate from "./commands/migrate";
import list from "./commands/list";
import check from "./commands/check";
import update from "./commands/update";
import { showBanner, showUpdateBanner, getVersion } from "./ui/banner";
import { checkForUpdate } from "./utils/updater";

const isHelp = process.argv.includes("--help") || process.argv.includes("-h");
const isUpdateCommand = process.argv.includes("update");
showBanner(isHelp);

if (!isUpdateCommand) {
  const availableUpdate = checkForUpdate();
  if (availableUpdate) {
    showUpdateBanner(availableUpdate);
  }
}

const main = defineCommand({
  meta: {
    name: "ghlt",
    version: getVersion(),
    description: "GitHub Labels Template — apply a curated set of labels to any repo using gh CLI.",
  },
  args: {
    version: {
      type: "boolean",
      alias: "v",
      description: "Show version number",
    },
  },
  subCommands: {
    apply,
    wipe,
    migrate,
    generate,
    list,
    check,
    update,
  },
  run({ args }) {
    if (args.version) {
      console.log(`ghlt v${getVersion()}`);
    }
  },
});

runMain(main);
