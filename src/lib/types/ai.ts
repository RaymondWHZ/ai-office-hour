import { z } from "zod";
import type { UIMessage } from "ai";

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

// Tool invocation schema for streaming responses
export const toolInvocationSchema = z.object({
  toolCallId: z.string(),
  toolName: z.enum(["edit_document", "generate_options"]),
  args: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()).optional(),
  state: z.enum(["call", "result", "partial-call"]).optional(),
});

// Updated message schema supporting both old and new formats
export const messageSchema = z.union([
  z.object({
    role: z.literal("system"),
    content: z.string(),
  }),
  z.object({
    role: z.literal("user"),
    content: z.string(),
  }),
  // Old format: assistant content is AIResponse object (for backward compatibility)
  z.object({
    role: z.literal("assistant"),
    content: aiResponseSchema,
  }),
  // New format: assistant content is string with optional tool invocations
  z.object({
    role: z.literal("assistant"),
    content: z.string(),
    toolInvocations: z.array(toolInvocationSchema).optional(),
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
export type ToolInvocation = z.infer<typeof toolInvocationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Helper type for streaming assistant messages
export type StreamedAssistantMessage = {
  role: "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
};

// Helper function to extract edits from a message (supports both old and new formats)
export const extractEditsFromMessage = (message: Message): EditOperation[] => {
  if (message.role !== "assistant") return [];

  // Old format: content is AIResponse object
  if (typeof message.content === "object" && "edits" in message.content) {
    return message.content.edits;
  }

  // New format: check toolInvocations
  if ("toolInvocations" in message && message.toolInvocations) {
    const editTool = message.toolInvocations.find(
      (inv) => inv.toolName === "edit_document",
    );
    if (editTool && editTool.args && "edits" in editTool.args) {
      return editTool.args.edits as EditOperation[];
    }
  }

  return [];
};

// Helper function to extract options from a message (supports both old and new formats)
export const extractOptionsFromMessage = (message: Message): Option[] => {
  if (message.role !== "assistant") return [];

  // Old format: content is AIResponse object
  if (typeof message.content === "object" && "options" in message.content) {
    return message.content.options;
  }

  // New format: check toolInvocations
  if ("toolInvocations" in message && message.toolInvocations) {
    const optionsTool = message.toolInvocations.find(
      (inv) => inv.toolName === "generate_options",
    );
    if (optionsTool) {
      // Check in args first (tool call)
      if (optionsTool.args && "options" in optionsTool.args) {
        return optionsTool.args.options as Option[];
      }
      // Check in result (tool execution result)
      if (optionsTool.result && "options" in optionsTool.result) {
        return optionsTool.result.options as Option[];
      }
    }
  }

  return [];
};

// Helper function to get explanation text from a message (supports both old and new formats)
export const extractExplanationFromMessage = (message: Message): string => {
  if (message.role !== "assistant") return "";

  // Old format: content is AIResponse object
  if (typeof message.content === "object" && "explanation" in message.content) {
    return message.content.explanation;
  }

  // New format: content is string
  if (typeof message.content === "string") {
    return message.content;
  }

  return "";
};

export type TutorMessage = UIMessage<
  never,
  {
    edit_document: {
      edits: EditOperation[];
      reasoning: string;
    };
    generate_options: {
      options: Option[];
    };
  }
>;
