import { generateText } from "ai";
import type { RequestHandler } from "./$types";
import { anthropic } from "$lib/ai";
import { DOCUMENT_SPECS } from "$lib/constants/documentSpecs";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.text();

    // Call AI API using Vercel AI SDK
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5"),
      prompt: `
Following the following guideline:

${DOCUMENT_SPECS}

Format the following markdown:

${body}
`,
      temperature: 0.7,
    });

    // Return the structured response
    return new Response(JSON.stringify({ data: text }), {
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
