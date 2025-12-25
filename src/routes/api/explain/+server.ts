import { generateText } from "ai";
import { EXPLAIN_PROMPT } from "$lib/constants/prompts/explain.prompt";
import type { RequestHandler } from "./$types";
import { anthropic } from "$lib/ai";

export const POST: RequestHandler = async ({ request }) => {
  const { selectedText, context } = await request.json();

  const result = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system: EXPLAIN_PROMPT,
    prompt: `Selected text: "${selectedText}"${context ? `\n\nSurrounding context: ${context}` : ""}`,
    temperature: 0.3,
  });

  const text = result.text.trim();
  const separatorIndex = text.indexOf("---");

  if (separatorIndex === -1) {
    // Fallback if no separator found
    return new Response(
      JSON.stringify({
        title: "Explanation",
        explanation: text,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const title = text.slice(0, separatorIndex).trim();
  const explanation = text.slice(separatorIndex + 3).trim();

  return new Response(JSON.stringify({ title, explanation }), {
    headers: { "Content-Type": "application/json" },
  });
};
