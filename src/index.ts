#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import apply from "./commands/apply";
import wipe from "./commands/wipe";

const main = defineCommand({
  meta: {
    name: "ghlt",
    version: "0.1.0",
    description: "GitHub Labels Template — apply a curated set of labels to any repo using gh CLI.",
  },
  subCommands: {
    apply,
    wipe,
  },
});

runMain(main);
