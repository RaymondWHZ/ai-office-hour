import {
  CLAUDE_API_KEY,
  OPENAI_API_KEY,
  DEEPSEEK_API_KEY,
} from "$env/static/private";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import type { ModelType } from "$lib/stores/modelStore.svelte";
import type { LanguageModel } from "ai";

export const anthropic = createAnthropic({
  apiKey: CLAUDE_API_KEY,
});

export const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});

export const deepseek = createDeepSeek({
  apiKey: DEEPSEEK_API_KEY,
});

const models: Record<ModelType, () => LanguageModel> = {
  "claude-haiku-4-5": () => anthropic("claude-haiku-4-5"),
  "gpt-4o-mini": () => openai("gpt-4o-mini"),
  "deepseek-chat": () => deepseek("deepseek-chat"),
};

export const getModel = (model: ModelType): LanguageModel => {
  return models[model]();
};
