import { CLAUDE_API_KEY, OPENAI_API_KEY } from "$env/static/private";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { ModelType } from "$lib/stores/modelStore.svelte";
import { getSelectedModel } from "$lib/stores/modelStore.svelte";
import type { LanguageModel } from "ai";

export const anthropic = createAnthropic({
  apiKey: CLAUDE_API_KEY,
});

export const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});

export const getModel = (): LanguageModel => {
  const selectedModel = getSelectedModel();
  
  if (selectedModel === "gpt-4o-mini") {
    return openai("gpt-4o-mini");
  }
  
  return anthropic("claude-haiku-4-5");
};
