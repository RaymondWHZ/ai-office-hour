import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { TUTOR_PROMPT } from "$lib/constants/prompts";
import type { RequestHandler } from "./$types";
import { getModel } from "$lib/ai";
import { tools } from "$lib/tools";
import type { ModelType } from "$lib/stores/modelStore.svelte";

export const POST: RequestHandler = async ({ request }) => {
  const {
    messages,
    documentContent,
    model,
  }: {
    messages: UIMessage[];
    documentContent: string;
    model: ModelType;
  } = await request.json();

  // Convert UI messages to model messages
  const modelMessages = convertToModelMessages(messages);

  // Add document context to the system message
  const systemMessage = `${TUTOR_PROMPT}

Current Document Content:

\`\`\`
${documentContent || "No document provided"}
\`\`\``;

  // Call AI API using Vercel AI SDK with streaming
  const result = streamText({
    model: getModel(model),
    system: systemMessage,
    messages: modelMessages,
    temperature: 0.7,
    tools,
  });

  // Return streaming response
  return result.toUIMessageStreamResponse();
};
