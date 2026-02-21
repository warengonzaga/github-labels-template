import pc from "picocolors";

export function success(msg: string) {
  console.log(pc.green(`  ✓ ${msg}`));
}

export function error(msg: string) {
  console.log(pc.red(`  ✗ ${msg}`));
}

export function warn(msg: string) {
  console.log(pc.yellow(`  ⚠ ${msg}`));
}

export function info(msg: string) {
  console.log(pc.cyan(`  ℹ ${msg}`));
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
