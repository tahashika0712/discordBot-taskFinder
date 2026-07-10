import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { SourceMessage, TaskExtraction } from "../types.js";
import { buildSystemPrompt, buildUserPrompt, taskExtractionSchema } from "./prompt.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function extractTask(message: SourceMessage): Promise<TaskExtraction> {
  const response = await client.messages.create({
    model: config.claudeModel,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(message) }],
    output_config: {
      format: {
        type: "json_schema",
        schema: taskExtractionSchema,
      },
    },
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claudeがこのメッセージの処理を拒否しました（refusal）。");
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  if (!textBlock) {
    throw new Error("Claudeの応答にテキストブロックが含まれていません。");
  }

  return JSON.parse(textBlock.text) as TaskExtraction;
}
