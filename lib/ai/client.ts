import { createOpenAI } from "@ai-sdk/openai";

export function getAiModel() {
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o-mini");
  }
  throw new Error("OPENAI_API_KEY must be set for AI agents.");
}
