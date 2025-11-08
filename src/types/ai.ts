import { z } from "zod";

// Zod schemas for runtime validation
export const editOperationSchema = z.object({
  search: z.string(),
  replace: z.string(),
});

export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const aiResponseSchema = z.object({
  explanation: z.string(),
  edits: z.array(editOperationSchema),
  options: z.array(optionSchema),
});

export const messageSchema = z.union([
  z.object({
    role: z.literal("system"),
    content: z.string(),
  }),
  z.object({
    role: z.literal("user"),
    content: z.string(),
  }),
  z.object({
    role: z.literal("assistant"),
    content: aiResponseSchema,
  }),
]);

export const chatRequestSchema = z.object({
  documentContent: z.string(),
  userQuestion: z.string(),
  chatHistory: z.array(messageSchema),
});

// Inferred types from schemas
export type EditOperation = z.infer<typeof editOperationSchema>;
export type Option = z.infer<typeof optionSchema>;
export type Message = z.infer<typeof messageSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
