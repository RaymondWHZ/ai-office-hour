import type { APIRoute } from "astro";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { chatRequestSchema, aiResponseSchema } from "../../types/ai";
import { SYSTEM_PROMPT } from "../../lib/prompts";

const anthropic = createAnthropic({
  apiKey: import.meta.env.CLAUDE_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = chatRequestSchema.parse(body);

    const { documentContent, userQuestion, chatHistory } = validatedRequest;

    // Construct the user message with document context
    const userMessage = `

Current Document Content:

\`\`\`
${documentContent}
\`\`\`

Student Newest Question: ${userQuestion}

`;

    const transformedChatHistory = chatHistory.map((message) =>
      message.role === "assistant"
        ? {
            role: "assistant" as const,
            content:
              "Previous output in json format: " +
              JSON.stringify(message.content),
          }
        : message,
    );

    // Call AI API using Vercel AI SDK
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...transformedChatHistory,
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      schema: aiResponseSchema,
    });

    // Return the structured response
    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
