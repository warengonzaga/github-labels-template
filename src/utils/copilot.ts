import { CopilotClient } from "@github/copilot-sdk";
import type { Label } from "./gh";
import labels from "../labels.json";

const CATEGORY_NAMES: Record<string, string> = {
  type: "Type",
  status: "Status",
  community: "Community",
  resolution: "Resolution",
  area: "Area",
};

function buildSystemPrompt(
  category: string,
  count: number
): string {
  const categoryTitle = CATEGORY_NAMES[category] ?? category;
  const existingLabels = (labels as Record<string, Label[]>)[category] ?? [];
  const existingList = existingLabels
    .map((l) => `  - "${l.name}" (${l.color}) — ${l.description}`)
    .join("\n");

  return [
    `You are a GitHub label generator. Generate exactly ${count} label suggestions for the "${categoryTitle}" category.`,
    "",
    "Each label must follow this exact JSON format:",
    "[",
    `  { "name": "label-name", "color": "hex123", "description": "[${categoryTitle}] Description text [scope]" }`,
    "]",
    "",
    "Rules:",
    "- name: lowercase, concise (1-3 words), use spaces for multi-word names",
    "- color: 6-character hex without #, choose colors that are visually distinct from existing labels",
    `- description: MUST start with [${categoryTitle}] and end with [issues], [PRs], or [issues, PRs]`,
    "- Do NOT duplicate any of these existing labels:",
    existingList,
    "",
    "Return ONLY the JSON array, no markdown fences, no explanation, no extra text.",
  ].join("\n");
}

function buildUserPrompt(
  description: string,
  refinement?: string
): string {
  let prompt = `I need a label for: ${description}`;
  if (refinement) {
    prompt += `\n\nRefinement feedback: ${refinement}`;
  }
  return prompt;
}

/**
 * Parse the AI response into Label objects.
 * Handles responses that may include markdown fences or extra text.
 */
export function parseLabelsResponse(text: string): Label[] {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  // Try to extract JSON array from the text
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error("No JSON array found in response");
  }

  const parsed = JSON.parse(arrayMatch[0]);

  if (!Array.isArray(parsed)) {
    throw new Error("Response is not a JSON array");
  }

  // Validate each label
  return parsed.map((item: unknown, i: number) => {
    const obj = item as Record<string, unknown>;
    if (
      typeof obj.name !== "string" ||
      typeof obj.color !== "string" ||
      typeof obj.description !== "string"
    ) {
      throw new Error(
        `Label at index ${i} is missing required fields (name, color, description)`
      );
    }

    // Normalize color — strip # if included
    const color = obj.color.replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(color)) {
      throw new Error(
        `Label "${obj.name}" has invalid color "${obj.color}" — must be 6-char hex`
      );
    }

    return {
      name: obj.name,
      color: color.toLowerCase(),
      description: obj.description,
    };
  });
}

/**
 * Generate label suggestions using the Copilot SDK.
 */
export async function generateLabels(options: {
  category: string;
  description: string;
  count?: number;
  refinement?: string;
}): Promise<Label[]> {
  const { category, description, count = 3, refinement } = options;

  const client = new CopilotClient();
  await client.start();

  try {
    const session = await client.createSession({
      systemMessage: {
        content: buildSystemPrompt(category, count),
      },
    });

    try {
      const userPrompt = buildUserPrompt(description, refinement);

      // Send prompt and wait for complete response
      const response = await session.sendAndWait({ content: userPrompt });

      if (!response || !response.data?.content) {
        throw new Error("No response received from Copilot");
      }

      return parseLabelsResponse(response.data.content);
    } finally {
      await session.destroy();
    }
  } finally {
    await client.stop();
  }
}

/**
 * Check if GitHub Copilot is available and authenticated.
 */
export async function checkCopilotAvailable(): Promise<boolean> {
  try {
    const client = new CopilotClient();
    await client.start();
    await client.ping();
    await client.stop();
    return true;
  } catch {
    return false;
  }
}

// Exported for testing
export { buildSystemPrompt, buildUserPrompt };
