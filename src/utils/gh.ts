import { execFile } from "node:child_process";

export interface Label {
  name: string;
  color: string;
  description: string;
}

function run(args: string[]): Promise<{ exitCode: number; stdout: string }> {
  return new Promise((resolve) => {
    execFile("gh", args, (error, stdout, stderr) => {
      resolve({
        exitCode: error ? (error as any).code ?? 1 : 0,
        stdout: stdout ?? "",
      });
    });
  });
}

export async function checkGhInstalled(): Promise<boolean> {
  try {
    const { exitCode } = await run(["--version"]);
    return exitCode === 0;
  } catch {
    return false;
  }
}

export async function checkGhAuth(): Promise<boolean> {
  try {
    const { exitCode } = await run(["auth", "status"]);
    return exitCode === 0;
  } catch {
    return false;
  }
}

export async function detectRepo(): Promise<string | null> {
  try {
    const { exitCode, stdout } = await run([
      "repo",
      "view",
      "--json",
      "nameWithOwner",
      "-q",
      ".nameWithOwner",
    ]);
    if (exitCode !== 0) return null;
    const trimmed = stdout.trim();
    return trimmed || null;
  } catch {
    return null;
  }
}

export async function listLabels(repo: string): Promise<string[]> {
  const { exitCode, stdout } = await run([
    "label",
    "list",
    "--repo",
    repo,
    "--json",
    "name",
    "-q",
    ".[].name",
    "--limit",
    "100",
  ]);
  if (exitCode !== 0) return [];
  const text = stdout.trim();
  if (!text) return [];
  return text.split("\n").map((n) => n.trim());
}

export async function createLabel(
  repo: string,
  label: Label
): Promise<boolean> {
  const { exitCode } = await run([
    "label",
    "create",
    label.name,
    "--repo",
    repo,
    "--color",
    label.color,
    "--description",
    label.description,
  ]);
  return exitCode === 0;
}

export async function editLabel(
  repo: string,
  label: Label
): Promise<boolean> {
  const { exitCode } = await run([
    "label",
    "edit",
    label.name,
    "--repo",
    repo,
    "--color",
    label.color,
    "--description",
    label.description,
  ]);
  return exitCode === 0;
}

export async function deleteLabel(
  repo: string,
  name: string
): Promise<boolean> {
  const { exitCode } = await run([
    "label",
    "delete",
    name,
    "--repo",
    repo,
    "--yes",
  ]);
  return exitCode === 0;
}
