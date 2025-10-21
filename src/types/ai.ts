import { z } from "zod";

// Zod schemas for runtime validation
export const EditOperationSchema = z.object({
  search: z.string(),
  replace: z.string(),
});

export const OptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  options: z.array(OptionSchema).optional(),
});

export const AIResponseSchema = z.object({
  explanation: z.string(),
  edits: z.array(EditOperationSchema),
  options: z.array(OptionSchema),
});

export const ChatRequestSchema = z.object({
  documentContent: z.string(),
  userQuestion: z.string(),
  chatHistory: z.array(MessageSchema),
});

// Inferred types from schemas
export type EditOperation = z.infer<typeof EditOperationSchema>;
export type Option = z.infer<typeof OptionSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
