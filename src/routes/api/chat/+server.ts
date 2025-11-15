import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  type UIMessage,
} from "ai";
import { SYSTEM_PROMPT } from "$lib/constants/prompts";
import type { RequestHandler } from "./$types";
import { anthropic } from "$lib/ai";
import { tools } from "$lib/tools";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const {
      messages,
      documentContent,
    }: {
      messages: UIMessage[];
      documentContent?: string;
    } = await request.json();

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        // Define tools for document editing and option generation

        // Convert UI messages to model messages
        const modelMessages = convertToModelMessages(messages);

        // Add document context to the system message
        const systemMessage = `${SYSTEM_PROMPT}

Current Document Content:

\`\`\`
${documentContent || "No document provided"}
\`\`\``;

        // Call AI API using Vercel AI SDK with streaming
        const result = streamText({
          model: anthropic("claude-haiku-4-5"),
          system: systemMessage,
          messages: modelMessages,
          temperature: 0.7,
          tools,
          maxRetries: 3,
          stopWhen: stepCountIs(5),
        });

        // Merge the streamText result into our UI message stream
        writer.merge(result.toUIMessageStream());
      },
    });

    // Return streaming response
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("API Error:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
