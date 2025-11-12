import { CLAUDE_API_KEY } from "$env/static/private";
import { createAnthropic } from "@ai-sdk/anthropic";

export const anthropic = createAnthropic({
  apiKey: CLAUDE_API_KEY,
});
