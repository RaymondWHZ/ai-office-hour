import { z } from "zod";

// Type definitions for AI interaction
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface EditOperation {
  search: string;
  replace: string;
}

export interface AIResponse {
  explanation: string;
  edits: EditOperation[];
}

// Zod schemas for runtime validation
export const EditOperationSchema = z.object({
  search: z.string(),
  replace: z.string(),
});

export const AIResponseSchema = z.object({
  explanation: z.string(),
  edits: z.array(EditOperationSchema),
});

export const ChatRequestSchema = z.object({
  documentContent: z.string(),
  userQuestion: z.string(),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
