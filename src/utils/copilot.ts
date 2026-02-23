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

/**
 * Build the system prompt for the Copilot session.
 * @param category - The label category (e.g., "type", "status")
 * @param count - Number of label suggestions to generate
 * @param attempt - Attempt number for variation (1-based, defaults to 1)
 * @returns The formatted system prompt string
 */
function buildSystemPrompt(
  category: string,
  count: number,
  attempt: number = 1
): string {
  const categoryTitle = CATEGORY_NAMES[category] ?? category;
  const existingLabels = (labels as Record<string, Label[]>)[category] ?? [];
  const existingList = existingLabels
    .map((l) => `  - "${l.name}" (${l.color}) — ${l.description}`)
    .join("\n");

  const variationHint =
    attempt > 1
      ? `IMPORTANT: This is attempt #${attempt}. You MUST generate completely different label names, colors, and descriptions than any previous suggestions. Be creative and explore new angles.`
      : null;

  return [
    `You are a GitHub label generator. The user will describe the kind of label they need. Generate exactly ${count} label suggestions for the "${categoryTitle}" category that DIRECTLY match what the user is asking for.`,
    "",
    "CRITICAL: Every suggestion MUST be relevant to the user's description. Do NOT generate generic or unrelated labels. Focus on what the user specifically asked for.",
    ...(variationHint ? ["", variationHint, ""] : [""]),
    "Each label must follow this exact JSON format:",
    "[",
    `  { "name": "label-name", "color": "hex123", "description": "[${categoryTitle}] Description text [scope]" }`,
    "]",
    "",
    "Rules:",
    "- name: lowercase, concise (1-3 words), use spaces for multi-word names, must reflect the user's request",
    "- color: 6-character hex without #, choose colors that are visually distinct from existing labels",
    `- description: MUST start with [${categoryTitle}] and end with [issues], [PRs], or [issues, PRs]`,
    "- Do NOT duplicate any of these existing labels:",
    existingList,
    "",
    "Return ONLY the JSON array, no markdown fences, no explanation, no extra text.",
  ].join("\n");
}

/**
 * Build the user prompt for Copilot label generation.
 * @param description - The label description or use case
 * @param refinement - Optional refinement feedback for iterative improvements
 * @param attempt - Attempt number for variation (1-based, defaults to 1)
 * @returns The formatted user prompt string
 */
function buildUserPrompt(
  description: string,
  refinement?: string,
  attempt: number = 1
): string {
  let prompt = `I need a label for: ${description}`;
  if (refinement) {
    prompt += `\n\nRefinement feedback: ${refinement}`;
  }
  if (attempt > 1) {
    prompt += `\n\nGenerate different suggestions from previous attempts. This is attempt #${attempt}, so provide fresh and unique alternatives.`;
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
    const normalizedColor = obj.color.replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalizedColor)) {
      throw new Error(
        `Label "${obj.name}" has invalid color "${obj.color}" — must be 6-char hex`
      );
    }

    return {
      name: obj.name,
      color: normalizedColor.toLowerCase(),
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
  model?: string;
  attempt?: number;
}): Promise<Label[]> {
  const { category, description, count = 3, refinement, model, attempt = 1 } = options;

  const client = new CopilotClient();
  await client.start();

  try {
    const sessionConfig: Record<string, unknown> = {
      systemMessage: {
        content: buildSystemPrompt(category, count, attempt),
      },
    };

    // Only set model if explicitly provided — otherwise use user's Copilot default
    if (model) {
      sessionConfig.model = model;
    }

    const session = await client.createSession(sessionConfig);

    try {
      const userPrompt = buildUserPrompt(description, refinement, attempt);

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
 * Returns a specific error message if something goes wrong, or null if OK.
 */
export async function checkCopilotAvailable(): Promise<string | null> {
  let client: InstanceType<typeof CopilotClient> | null = null;

  try {
    client = new CopilotClient();
    await client.start();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("ENOENT") || msg.includes("not found")) {
      return "Copilot CLI binary not found. Ensure GitHub Copilot is installed and your gh CLI is up to date.";
    }

    return `Failed to start Copilot service: ${msg}`;
  }

  try {
    await client.ping();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (
      msg.includes("auth") ||
      msg.includes("token") ||
      msg.includes("401") ||
      msg.includes("403")
    ) {
      return "Copilot authentication failed. Ensure your GitHub account has an active Copilot subscription and run `gh auth login` to refresh your token.";
    }

    if (msg.includes("ECONNREFUSED") || msg.includes("timeout") || msg.includes("network")) {
      return "Could not reach GitHub Copilot service. Check your internet connection and try again.";
    }

    return `Copilot health check failed: ${msg}`;
  } finally {
    try {
      await client.stop();
    } catch {
      // Ignore cleanup errors
    }
  }

  return null; // All good
}

// Exported for testing
export { buildSystemPrompt, buildUserPrompt };
