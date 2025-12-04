<script lang="ts">
  import { onMount } from "svelte";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Loader } from "$lib/components/ui/loader";
  import { Textarea } from "$lib/components/ui/textarea";
  import { START_OPTIONS } from "$lib/constants/startOptions";
  import { Chat } from "@ai-sdk/svelte";
  import type {
    TutorMessage,
    PromptStudentInput,
    UserDataParts,
  } from "$lib/tools";
  import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
  import { applyEdits } from "$lib/documentEditor";
  import { SquareCheck } from "@lucide/svelte";
  import { getSelectedModel } from "$lib/stores/modelStore.svelte";
  import ChatPromptBlock from "./ChatPromptBlock.svelte";

  interface Props {
    documentContent?: string;
    messages?: TutorMessage[];
    inputValue?: string;
    isGenerating?: boolean;
  }

  let {
    documentContent = $bindable(""),
    messages = $bindable([]),
    inputValue = $bindable(""),
    isGenerating = $bindable(false),
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
  const hasActivePrompt = $derived.by(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return false;

    for (const part of lastMessage.parts) {
      if (part.type === "tool-prompt_student") {
        const output = part.output;
        // Active if no output yet, or output exists but not success and not dismissed
        if (!output || (!output.success && !output.dismissed)) {
          return true;
        }
      }
    }
    return false;
  });

  // Derive if we're on start screen (no messages)
  const isStartScreen = $derived(chat.messages.length === 0);

  // Derive if bottom input should be shown
  const showBottomInput = $derived(
    !isStartScreen && !hasActivePrompt && !isGenerating,
  );

  const lastPart = $derived.by(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return null;
    return lastMessage.parts[lastMessage.parts.length - 1];
  });

  // Helper to send message with data part
  const sendWithData = (
    text: string,
    dataType: keyof UserDataParts,
    data: UserDataParts[keyof UserDataParts],
  ) => {
    if (!text.trim() || isGenerating) return;
    chat.sendMessage(
      {
        parts: [
          { type: `data-${dataType}`, data } as never,
          { type: "text", text: text.trim() },
        ],
      },
      { body: { documentContent, model: getSelectedModel() } },
    );
  };

  // Send user typed input
  export const sendUserInput = (text: string) => {
    sendWithData(text, "user-input", { text: text.trim() });
  };

  // Send start option selection
  export const sendStartOption = (title: string, prompt: string) => {
    sendWithData(prompt, "start-option", { title, prompt });
  };

  // Send follow-up option selection
  export const sendFollowUpOption = (label: string, value: string) => {
    sendWithData(value, "follow-up-option", { label, value });
  };

  // Send ask tutor (What's this?) message
  export const sendAskTutor = (selectedText: string, question: string) => {
    const text = `Regarding: "${selectedText}"\n\nQuestion: ${question}`;
    sendWithData(text, "ask-tutor", { selectedText, question });
  };

  // Send ask help message from response block
  export const sendAskHelp = (question: string, currentAnswer: string) => {
    let text = `[Help Request]\n\nQuestion: ${question}`;
    if (currentAnswer.trim()) {
      text += `\n\nMy current answer: ${currentAnswer}`;
    }
    text += `\n\nCan you give me a hint?`;
    sendWithData(text, "ask-help", { question, currentAnswer });
  };

  // Send hidden prompt answer (auto-continue after correct answer)
  const sendPromptAnswer = (answer: string) => {
    const text = `[Student answered correctly: ${answer}]\n\nPlease continue with the explanation.`;
    sendWithData(text, "prompt-answer", { answer, hidden: true });
  };

  // Legacy submitMessage for backward compatibility
  export const submitMessage = (message: string) => {
    sendUserInput(message);
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

    if (continueMessage && output.answer) {
      sendPromptAnswer(output.answer);
    }

    // Clean up pending context
    pendingPromptToolCalls.delete(toolCallId);
  };

  // Auto-scroll when content changes
  $effect(() => {
    void lastPart;
    void showBottomInput;
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
        sendUserInput(inputValue);
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
            sendUserInput(inputValue);
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
            onclick={() => sendStartOption(option.title, option.prompt)}
          >
            <span class="text-lg font-semibold">{option.title}</span>
            <span class="text-sm">{option.description}</span>
          </Card>
        {/each}
      </div>
    </div>
  {/if}

  {#each chat.messages as message, messageIndex}
    {@const dataPart = message.parts.find((p) => p.type.startsWith("data-"))}
    {@const dataType = dataPart?.type.replace("data-", "") as
      | keyof UserDataParts
      | undefined}
    {@const isHidden = dataType === "prompt-answer"}

    {#if !isHidden}
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
              {:else if dataType === "user-input"}
                <!-- Regular user input - show as is -->
                {part.text}
              {:else if dataType === "start-option" && dataPart && "data" in dataPart}
                <!-- Start option - show the title -->
                <span class="text-gray-600">Selected: </span>
                <span class="font-medium"
                  >{(dataPart.data as UserDataParts["start-option"])
                    .title}</span
                >
              {:else if dataType === "follow-up-option" && dataPart && "data" in dataPart}
                <!-- Follow-up option - show the label -->
                {(dataPart.data as UserDataParts["follow-up-option"]).label}
              {:else if dataType === "ask-tutor" && dataPart && "data" in dataPart}
                <!-- Ask tutor - show formatted with context -->
                {@const data = dataPart.data as UserDataParts["ask-tutor"]}
                <div class="flex flex-col gap-2">
                  <div
                    class="rounded border-l-4 border-blue-300 bg-blue-50 py-2 pr-3 pl-3 text-sm text-gray-600 italic"
                  >
                    "{data.selectedText}"
                  </div>
                  <div>{data.question}</div>
                </div>
              {:else if dataType === "ask-help" && dataPart && "data" in dataPart}
                <!-- Ask help - show formatted -->
                {@const data = dataPart.data as UserDataParts["ask-help"]}
                <div class="flex flex-col gap-2">
                  <div class="text-sm text-gray-500">
                    Help requested for: <span class="font-medium text-gray-700"
                      >{data.question}</span
                    >
                  </div>
                  {#if data.currentAnswer.trim()}
                    <div class="text-sm">
                      <span class="text-gray-500">My attempt:</span>
                      {data.currentAnswer}
                    </div>
                  {/if}
                </div>
              {:else}
                <!-- Fallback for messages without data parts -->
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
                    <span class="font-medium"
                      >Document updated successfully</span
                    >
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
                    onclick={() =>
                      sendFollowUpOption(option.label, option.value)}
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
            {@const isLastMessage = messageIndex === chat.messages.length - 1}
            <ChatPromptBlock
              input={part.input as PromptStudentInput}
              output={part.output}
              toolState={part.state}
              conversationContext={pendingContext?.conversationContext || ""}
              canUndo={isLastMessage}
              onComplete={(output, continueMessage) =>
                handlePromptComplete(toolCallId, output, continueMessage)}
            />
          {/if}
        {/each}
      </div>
    {/if}
  {/each}

  {#if isGenerating && !lastPart}
    <Loader />
  {/if}

  {#if showBottomInput}
    {@const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && inputValue.trim()) {
        e.preventDefault();
        sendUserInput(inputValue);
        inputValue = "";
      }
    }}
    <div class="flex flex-col gap-2 pb-6">
      <div
        class="text-xs font-semibold tracking-wide text-indigo-500 uppercase"
      >
        You
      </div>
      <div class="flex gap-3">
        <Textarea
          bind:value={inputValue}
          onkeydown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={isGenerating}
          class="min-h-[60px]"
        />
        <Button
          onclick={() => {
            sendUserInput(inputValue);
            inputValue = "";
          }}
          disabled={isGenerating || !inputValue.trim()}
        >
          Ask
        </Button>
      </div>
    </div>
  {/if}
</div>
