import pc from "picocolors";
import { info } from "./logger";

/**
 * Display a confirmation prompt and wait for user input.
 * Returns `true` if the user confirms, `false` otherwise.
 */
export async function confirmPrompt(message: string): Promise<boolean> {
  console.log(`\n${message}`);
  process.stdout.write(`${pc.dim("Continue? [y/N] ")}`);

  const response = await new Promise<string>((resolve) => {
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (data) => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
    process.stdin.resume();
  });

  if (response.toLowerCase() !== "y") {
    info("Aborted.");
    return false;
  }

  return true;
}
