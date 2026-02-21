import { LogEngine, LogMode } from "@wgtechlabs/log-engine";
import pc from "picocolors";

// Configure log-engine: INFO mode, no ISO timestamp, with local time, log level, emoji
LogEngine.configure({
  mode: LogMode.INFO,
  format: {
    includeIsoTimestamp: false,
    includeLocalTime: true,
    includeEmoji: true,
  },
});

export function success(msg: string) {
  LogEngine.log(msg);
}

export function error(msg: string) {
  LogEngine.error(msg);
}

export function warn(msg: string) {
  LogEngine.warn(msg);
}

export function info(msg: string) {
  LogEngine.info(msg);
}

export function heading(msg: string) {
  console.log(`\n${pc.bold(msg)}`);
}

export function summary(counts: {
  created?: number;
  updated?: number;
  skipped?: number;
  deleted?: number;
  failed?: number;
}) {
  const parts: string[] = [];

  if (counts.created) parts.push(pc.green(`${counts.created} created`));
  if (counts.updated) parts.push(pc.blue(`${counts.updated} updated`));
  if (counts.skipped) parts.push(pc.yellow(`${counts.skipped} skipped`));
  if (counts.deleted) parts.push(pc.red(`${counts.deleted} deleted`));
  if (counts.failed) parts.push(pc.red(pc.bold(`${counts.failed} failed`)));

  console.log(`\n${pc.bold("Summary:")} ${parts.join(", ")}`);
}

export { LogEngine };
