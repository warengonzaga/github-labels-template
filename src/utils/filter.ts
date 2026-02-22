import type { Label } from "./gh";

export interface FilterResult {
  entries: [string, Label[]][];
  warnings: string[];
}

/**
 * Filter labels by name and/or category.
 *
 * - No filters: returns all entries unchanged
 * - --category only: returns matching categories with all their labels
 * - --label only: returns matching labels from any category
 * - Both (union): all labels from matching categories + individual matches from other categories
 */
export function filterLabels(
  allLabels: Record<string, Label[]>,
  options: { label?: string; category?: string }
): FilterResult {
  const warnings: string[] = [];

  // Parse comma-separated values
  const labelFilter = options.label
    ? options.label
        .split(",")
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean)
    : null;

  const categoryFilter = options.category
    ? options.category
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
    : null;

  // No filters — return everything
  if (!labelFilter && !categoryFilter) {
    return {
      entries: Object.entries(allLabels) as [string, Label[]][],
      warnings,
    };
  }

  const validCategories = Object.keys(allLabels);

  // Validate category names
  if (categoryFilter) {
    for (const cat of categoryFilter) {
      if (!validCategories.includes(cat)) {
        warnings.push(
          `Unknown category "${cat}". Valid categories: ${validCategories.join(", ")}`
        );
      }
    }
  }

  // Validate label names
  if (labelFilter) {
    const allLabelNames = Object.values(allLabels)
      .flat()
      .map((l) => l.name.toLowerCase());
    for (const name of labelFilter) {
      if (!allLabelNames.includes(name)) {
        warnings.push(`Label "${name}" not found in the template.`);
      }
    }
  }

  // Build filtered entries with union semantics
  const entries = (Object.entries(allLabels) as [string, Label[]][])
    .map(([category, categoryLabels]): [string, Label[]] => {
      const categoryMatches =
        categoryFilter?.includes(category.toLowerCase()) ?? false;

      if (categoryMatches) {
        // Include all labels from this category
        return [category, categoryLabels];
      }

      if (labelFilter) {
        // Include only labels matching --label
        const matching = categoryLabels.filter((l) =>
          labelFilter.includes(l.name.toLowerCase())
        );
        return [category, matching];
      }

      // Category doesn't match and no label filter — exclude
      return [category, []];
    })
    .filter(([, categoryLabels]) => categoryLabels.length > 0);

  return { entries, warnings };
}
