import { tool, type InferUITools, type UIMessage } from "ai";
import z from "zod";

export const editOperationSchema = z.object({
  search: z.string(),
  replace: z.string(),
});

export type EditOperation = z.infer<typeof editOperationSchema>;

export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type Option = z.infer<typeof optionSchema>;

export const tools = {
  edit_document: tool({
    description:
      "Apply edits to the student's document. Call this at an appropriate point during the conversation, like a TA would write while explaining. You can start with brief explanation, then edit the document, then continue explaining.",
    inputSchema: z.object({
      edits: z
        .array(editOperationSchema)
        .describe(
          "Array of search-replace operations. Each edit should include enough context (3-5 words before and after) to uniquely identify the text to replace.",
        ),
      summary: z
        .string()
        .describe(
          "Brief explanation of why you're making these edits (for logging/debugging)",
        ),
    }),
    outputSchema: z.union([
      z.object({
        success: z.literal(true),
        summary: z
          .string()
          .optional()
          .describe(
            "Copy of your input summary for confirmation/logging purposes.",
          ),
      }),
      z.object({
        success: z.literal(false),
        error: z
          .string()
          .optional()
          .describe("Error message if success is false."),
      }),
    ]),
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

export type TutorMessage = UIMessage<never, never, InferUITools<typeof tools>>;
