import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Label } from "./gh";

const CUSTOM_LABELS_FILE = "labels-custom.json";

/**
 * Resolve the path to labels-custom.json in the current working directory.
 */
function getCustomLabelsPath(): string {
  return resolve(process.cwd(), CUSTOM_LABELS_FILE);
}

/**
 * Load custom labels from labels-custom.json.
 * Returns an empty object if the file doesn't exist.
 */
export function loadCustomLabels(): Record<string, Label[]> {
  const filePath = getCustomLabelsPath();

  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as Record<string, Label[]>;
  } catch {
    return {};
  }
}

/**
 * Save a label to labels-custom.json under the given category.
 * Creates the file if it doesn't exist, appends to the category array.
 */
export function saveCustomLabel(category: string, label: Label): void {
  const filePath = getCustomLabelsPath();
  const data = loadCustomLabels();

  if (!data[category]) {
    data[category] = [];
  }

  // Avoid duplicates by name (case-insensitive)
  const exists = data[category].some(
    (l) => l.name.toLowerCase() === label.name.toLowerCase()
  );

  if (!exists) {
    data[category].push(label);
  } else {
    // Update existing label
    const index = data[category].findIndex(
      (l) => l.name.toLowerCase() === label.name.toLowerCase()
    );
    data[category][index] = label;
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
