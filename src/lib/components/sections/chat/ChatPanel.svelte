<script lang="ts">
  import { onMount } from "svelte";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Loader } from "$lib/components/ui/loader";
  import { Textarea } from "$lib/components/ui/textarea";
  import { START_OPTIONS } from "$lib/constants/startOptions";
  import { Chat } from "@ai-sdk/svelte";
  import type { TutorMessage, PromptStudentInput } from "$lib/tools";
  import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
  import { applyEdits } from "$lib/documentEditor";
  import { SquareCheck } from "@lucide/svelte";
  import { getSelectedModel } from "$lib/stores/modelStore.svelte";
  import ChatPromptBlock from "./ChatPromptBlock.svelte";

  interface Props {
    documentContent?: string;
    messages?: TutorMessage[];
    isGenerating?: boolean;
    hasActivePrompt?: boolean;
    showBottomInput?: boolean;
    inputValue?: string;
    onSubmit?: (message: string) => void;
  }

  let {
    documentContent = $bindable(""),
    messages = $bindable([]),
    isGenerating = $bindable(false),
    hasActivePrompt = $bindable(false),
    showBottomInput = $bindable(true),
    inputValue = $bindable(""),
    onSubmit,
  }: Props = $props();

  let messagesContainer: HTMLDivElement;

  // Track pending prompt tool calls that need output
  let pendingPromptToolCalls = $state<
    Map<string, { conversationContext: string }>
  >(new Map());

  const chat = new Chat<TutorMessage>({
    messages,

    sendAutomaticallyWhen: ({ messages }) => {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "assistant") return false;
      const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
      if (lastPart.type === "tool-generate_options") return false;
      if (lastPart.type === "tool-prompt_student") return false;

      return lastAssistantMessageIsCompleteWithToolCalls({ messages });
    },

    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "edit_document") {
        const { edits, summary } = toolCall.input;
        try {
          documentContent = applyEdits(documentContent, edits);
          chat.addToolOutput({
            tool: "edit_document",
            toolCallId: toolCall.toolCallId,
            output: { success: true, summary },
          });
        } catch (editError) {
          chat.addToolOutput({
            tool: "edit_document",
            toolCallId: toolCall.toolCallId,
            output: {
              success: false,
              error:
                editError instanceof Error
                  ? editError.message
                  : "Failed to apply edits.",
            },
          });
        }
      }

      if (toolCall.toolName === "prompt_student") {
        // Get conversation context from last assistant message
        const lastAssistantMessage = chat.messages
          .filter((m) => m.role === "assistant")
          .pop();
        const conversationContext =
          lastAssistantMessage?.parts
            .filter((p) => p.type === "text" && "text" in p)
            .map((p) => (p as { type: "text"; text: string }).text)
            .join("\n") || "";

        // Store the context for later use by the component
        pendingPromptToolCalls.set(toolCall.toolCallId, {
          conversationContext,
        });
      }
    },
  });

  // Sync messages
  $effect(() => {
    chat.messages = messages;
  });

  // Update isGenerating state
  $effect(() => {
    isGenerating = chat.status === "streaming" || chat.status === "submitted";
  });

  // Derive if there's an active (unanswered, not dismissed) prompt in the last message
  const activePromptInfo = $derived.by(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return null;

    for (const part of lastMessage.parts) {
      if (part.type === "tool-prompt_student") {
        const output = part.output;
        // Active if no output yet, or output exists but not success and not dismissed
        if (!output || (!output.success && !output.dismissed)) {
          return { part, hasOutput: !!output };
        }
      }
    }
    return null;
  });

  // Update hasActivePrompt binding
  $effect(() => {
    hasActivePrompt = activePromptInfo !== null;
  });

  // Derive if we're on start screen (no messages)
  const isStartScreen = $derived(chat.messages.length === 0);

  // Update showBottomInput binding - hide bottom input on start screen or when there's an active prompt
  $effect(() => {
    showBottomInput = !isStartScreen && !hasActivePrompt;
  });

  const lastPart = $derived.by(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return null;
    return lastMessage.parts[lastMessage.parts.length - 1];
  });

  export const submitMessage = (message: string) => {
    const textToSend = message.trim();
    if (textToSend && !isGenerating) {
      chat.sendMessage(
        { text: textToSend },
        { body: { documentContent, model: getSelectedModel() } },
      );
    }
  };

  const handlePromptComplete = (
    toolCallId: string,
    output: { success: boolean; answer?: string; dismissed?: boolean },
    continueMessage?: string,
  ) => {
    chat.addToolOutput({
      tool: "prompt_student",
      toolCallId,
      output,
    });

    if (continueMessage) {
      chat.sendMessage(
        { text: continueMessage },
        { body: { documentContent, model: getSelectedModel() } },
      );
    }

    // Clean up pending context
    pendingPromptToolCalls.delete(toolCallId);
  };

  // Auto-scroll
  $effect(() => {
    void lastPart;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  onMount(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
</script>

<div
  class="flex flex-1 flex-col gap-4 overflow-y-auto px-12 py-6"
  bind:this={messagesContainer}
>
  {#if isStartScreen}
    {@const handleStartKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && inputValue.trim()) {
        e.preventDefault();
        submitMessage(inputValue);
        inputValue = "";
      }
    }}
    <div class="flex h-full flex-col items-center justify-center gap-8 px-6">
      <div class="text-center">
        <p class="m-0 mb-2 text-xl font-semibold text-gray-700">
          Welcome to AI Office Hour
        </p>
        <p class="m-0 text-sm text-gray-500">
          Ask a question or choose a learning style to get started
        </p>
      </div>

      <!-- Input in the middle -->
      <div class="flex w-full max-w-md gap-3">
        <Textarea
          bind:value={inputValue}
          onkeydown={handleStartKeyDown}
          placeholder="Ask a question..."
          disabled={isGenerating}
          class="min-h-[60px]"
        />
        <Button
          onclick={() => {
            submitMessage(inputValue);
            inputValue = "";
          }}
          disabled={isGenerating || !inputValue.trim()}
        >
          Ask
        </Button>
      </div>

      <div class="flex items-center gap-4 text-sm text-gray-400">
        <span class="h-px w-12 bg-gray-200"></span>
        <span>or choose a learning style</span>
        <span class="h-px w-12 bg-gray-200"></span>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        {#each START_OPTIONS as option}
          <Card
            class="cursor-pointer select-none"
            onclick={() => submitMessage(option.prompt)}
          >
            <span class="text-lg font-semibold">{option.title}</span>
            <span class="text-sm">{option.description}</span>
          </Card>
        {/each}
      </div>
    </div>
  {/if}

  {#each chat.messages as message, messageIndex}
    <div class="flex flex-col gap-2">
      <div
        class="text-xs font-semibold tracking-wide uppercase {message.role ===
        'user'
          ? 'text-indigo-500'
          : 'text-emerald-600'}"
      >
        {message.role === "user" ? "You" : "AI Teaching Assistant"}
      </div>

      {#each message.parts as part}
        {#if part.type === "text" && "text" in part && part.text.trim()}
          <div class="py-4">
            {#if message.role === "assistant"}
              <Markdown class="prose max-w-none" value={part.text} />
            {:else}
              {part.text}
            {/if}
          </div>
        {:else if part.type === "tool-edit_document"}
          {#if part.state === "input-streaming"}
            <Card class="flex flex-row items-center gap-3">
              <Loader />
              <span class="font-medium">Editing document...</span>
            </Card>
          {:else}
            {@const result = part.output}
            <Card class="flex flex-col gap-2">
              {#if result?.success}
                <div class="flex flex-row items-center gap-3">
                  <SquareCheck />
                  <span class="font-medium">Document updated successfully</span>
                </div>
                <p class="m-0 text-sm text-gray-600">{result.summary}</p>
              {:else}
                <div class="flex flex-row items-center gap-3">
                  <span class="font-medium text-red-600"
                    >Failed to update document</span
                  >
                </div>
                <p class="m-0 text-sm text-gray-600">
                  {result?.error ?? "No response from edit tool."}
                </p>
              {/if}
            </Card>
          {/if}
        {:else if part.type === "tool-generate_options"}
          {@const options = part.output?.options}
          {@const isLastMessage = messageIndex === chat.messages.length - 1}

          {#if part.state === "input-streaming"}
            <Loader />
          {:else if options && options.length > 0 && isLastMessage}
            <div class="flex flex-wrap gap-2">
              {#each options as option}
                <Button
                  onclick={() => submitMessage(option.value)}
                  disabled={isGenerating}
                  variant="outline"
                >
                  {option.label}
                </Button>
              {/each}
            </div>
          {/if}
        {:else if part.type === "tool-prompt_student"}
          {@const toolCallId = part.toolCallId}
          {@const pendingContext = pendingPromptToolCalls.get(toolCallId)}
          <ChatPromptBlock
            input={part.input as PromptStudentInput}
            output={part.output}
            toolState={part.state}
            conversationContext={pendingContext?.conversationContext || ""}
            onComplete={(output, continueMessage) =>
              handlePromptComplete(toolCallId, output, continueMessage)}
          />
        {/if}
      {/each}
    </div>
  {/each}

  {#if isGenerating && !lastPart}
    <Loader />
  {/if}
</div>
