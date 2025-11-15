import {
  streamText,
  tool,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
} from "ai";
import { z } from "zod";
import {
  editOperationSchema,
  optionSchema,
  type TutorMessage,
} from "$lib/types/ai";
import { SYSTEM_PROMPT } from "$lib/constants/prompts";
import type { RequestHandler } from "./$types";
import { anthropic } from "$lib/ai";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const {
      messages,
      documentContent,
    }: {
      messages: TutorMessage[];
      documentContent?: string;
    } = await request.json();

    const stream = createUIMessageStream<TutorMessage>({
      execute: ({ writer }) => {
        // Define tools for document editing and option generation
        const tools = {
          edit_document: tool({
            description:
              "Apply edits to the student's document. Call this at an appropriate point during the conversation, like a TA would write while explaining. You can start with brief explanation, then edit the document, then continue explaining.",
            inputSchema: z.object({
              edits: z
                .array(editOperationSchema)
                .describe(
                  "Array of search-replace operations. Each edit should include enough context (3-5 words before and after) to uniquely identify the text to replace.",
                ),
              reasoning: z
                .string()
                .describe(
                  "Brief explanation of why you're making these edits (for logging/debugging)",
                ),
            }),
            execute: async ({ edits, reasoning }) => {
              // Send edit data to client via data part - transient so it's not stored in history
              writer.write({
                type: "data-edit_document",
                data: {
                  edits,
                  reasoning,
                },
                transient: true,
              });

              // Return the edits for the tool result
              return {
                success: true,
                edits,
                reasoning,
              };
            },
          }),
          generate_options: tool({
            description:
              "Generate follow-up question options for the student. Call this AFTER your explanation is complete to provide interactive follow-up paths.",
            inputSchema: z.object({
              options: z
                .array(optionSchema)
                .min(2)
                .max(4)
                .describe(
                  "Array of 2-4 follow-up options. Each should have a concise label (2-5 words) and a complete question value.",
                ),
            }),
            execute: async ({ options }) => {
              return {
                success: true,
                options,
              };
            },
          }),
        };

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
