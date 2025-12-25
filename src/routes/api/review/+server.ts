import { generateText } from "ai";
import { REVIEW_PROMPT } from "$lib/constants/prompts/review.prompt";
import type { RequestHandler } from "./$types";
import { anthropic } from "$lib/ai";

export const POST: RequestHandler = async ({ request }) => {
  const {
    question,
    answer,
    correctAnswer,
    documentContext,
    conversationContext,
  } = await request.json();

  let contextSection = "";
  if (documentContext) {
    contextSection = `Document Context:\n${documentContext}`;
  } else if (conversationContext) {
    contextSection = `Conversation Context (tutor's explanation before this question):\n${conversationContext}`;
  }

  const correctAnswerSection = correctAnswer
    ? `\nCorrect Answer: ${correctAnswer}`
    : "";

  const prompt = `Question: ${question}${correctAnswerSection}

Student's Answer: ${answer}

${contextSection}`;

  const result = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system: REVIEW_PROMPT,
    prompt,
    temperature: 0.3,
  });

  const text = result.text.trim();
  const separatorIndex = text.indexOf("---");

  if (separatorIndex === -1) {
    // Fallback if no separator found
    return new Response(
      JSON.stringify({
        status: "error",
        hint: "Could not evaluate your answer. Please try again.",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const statusLine = text.slice(0, separatorIndex).trim().toLowerCase();
  const feedback = text.slice(separatorIndex + 3).trim();

  const status = statusLine === "success" ? "success" : "error";

  return new Response(
    JSON.stringify({
      status,
      hint: status === "error" ? feedback : undefined,
      feedback: status === "success" ? feedback : undefined,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
