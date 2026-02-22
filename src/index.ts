#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import apply from "./commands/apply";
import wipe from "./commands/wipe";
import preview from "./commands/preview";
import generate from "./commands/generate";
import { showBanner, getVersion } from "./ui/banner";

const isHelp = process.argv.includes("--help") || process.argv.includes("-h");
showBanner(isHelp);

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
    preview,
    generate,
  },
  run({ args }) {
    if (args.version) {
      console.log(`ghlt v${getVersion()}`);
    }
  },
});

runMain(main);
