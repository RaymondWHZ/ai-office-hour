<script lang="ts">
  import { onMount, tick } from "svelte";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Loader } from "$lib/components/ui/loader";
  import { Textarea } from "$lib/components/ui/textarea";
  import { START_OPTIONS } from "$lib/constants/startOptions";
  import { Chat } from "@ai-sdk/svelte";
  import type { TutorMessage, UserDataParts } from "$lib/tools";
  import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
  import { applyEdit, appendToDocument } from "$lib/documentEditor";
  import { SquareCheck } from "@lucide/svelte";
  import { getSelectedModel } from "$lib/stores/modelStore.svelte";
  import ChatPromptBlock from "./ChatPromptBlock.svelte";

  const getLastPart = (messages: TutorMessage[]) => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return undefined;
    return lastMessage.parts[lastMessage.parts.length - 1];
  };

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

  let messagesContainer = $state() as HTMLDivElement;

  const chat = new Chat<TutorMessage>({
    messages,

    sendAutomaticallyWhen: ({ messages }) => {
      const lastPart = getLastPart(messages);
      if (lastPart) {
        if (
          lastPart.type === "tool-generate_options" &&
          lastPart.state === "output-available"
        ) {
          return false;
        }
        if (
          lastPart.type === "tool-prompt_student" &&
          lastPart.state === "output-available"
        ) {
          return false;
        }
      }

      return lastAssistantMessageIsCompleteWithToolCalls({ messages });
    },

    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "edit_document") {
        const { search, replace, summary } = toolCall.input;
        try {
          documentContent = applyEdit(documentContent, search, replace);
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
                  : "Failed to apply edit.",
            },
          });
        }
      }

      if (toolCall.toolName === "append_document") {
        const { content, summary } = toolCall.input;
        documentContent = appendToDocument(documentContent, content);
        chat.addToolOutput({
          tool: "append_document",
          toolCallId: toolCall.toolCallId,
          output: { success: true, summary },
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

  // Derive if there's an active prompt in the last message
  const hasActivePrompt = $derived.by(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return false;

    for (const part of lastMessage.parts) {
      if (part.type === "tool-prompt_student") {
        const state = part.output?.state;
        // Active if prompt exists and not success/dismissed
        if (
          state !== undefined &&
          state !== "success" &&
          state !== "dismissed"
        ) {
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
    if (!lastMessage || lastMessage.role !== "assistant") return undefined;
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

  // Called when student answers prompt correctly
  const handlePromptSuccess = (answer: string) => {
    sendPromptAnswer(answer);
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

{#snippet role_tag(role: "user" | "assistant" | "system")}
  {#if role === "system"}
    <div
      class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
    >
      System
    </div>
  {:else if role === "user"}
    <div class="text-xs font-semibold tracking-wide text-primary uppercase">
      You
    </div>
  {:else if role === "assistant"}
    <div class="text-xs font-semibold tracking-wide text-success uppercase">
      AI Teaching Assistant
    </div>
  {/if}
{/snippet}

<div
  class="flex h-full flex-col items-center overflow-y-auto px-12"
  bind:this={messagesContainer}
>
  <div class="flex w-full max-w-3xl flex-1 flex-col gap-6 pt-6">
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
          <p class="m-0 mb-2 text-xl font-semibold">
            Chat with your AI Teaching Assistant
          </p>
          <p class="m-0 text-sm text-muted-foreground">
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
            class="min-h-20"
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

        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <span class="h-px w-12 bg-border"></span>
          <span>or choose a preset</span>
          <span class="h-px w-12 bg-border"></span>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          {#each START_OPTIONS as option}
            <Card
              class="cursor-pointer transition-colors select-none hover:bg-accent"
              onclick={() => sendStartOption(option.title, option.prompt)}
            >
              <span class="text-base font-semibold">{option.title}</span>
              <span class="text-sm text-muted-foreground">
                {option.description}
              </span>
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
        <div class="flex flex-col gap-6">
          {@render role_tag(message.role)}

          {#each message.parts as part}
            {#if part.type === "text" && "text" in part && part.text.trim()}
              <div>
                {#if message.role === "assistant"}
                  <Markdown class="prose max-w-none" value={part.text} />
                {:else if dataType === "user-input"}
                  <!-- Regular user input - show as is -->
                  {part.text}
                {:else if dataType === "start-option" && dataPart && "data" in dataPart}
                  <!-- Start option - show the title -->
                  <span class="text-muted-foreground">Selected: </span>
                  <span class="font-medium">
                    {(dataPart.data as UserDataParts["start-option"]).title}
                  </span>
                {:else if dataType === "follow-up-option" && dataPart && "data" in dataPart}
                  <!-- Follow-up option - show the label -->
                  <span class="text-muted-foreground">Selected: </span>
                  <span class="font-medium">
                    {(dataPart.data as UserDataParts["follow-up-option"]).label}
                  </span>
                {:else if dataType === "ask-tutor" && dataPart && "data" in dataPart}
                  <!-- Ask tutor - show formatted with context -->
                  {@const data = dataPart.data as UserDataParts["ask-tutor"]}
                  <div class="flex flex-col gap-2">
                    <div
                      class="rounded border-l-4 border-info bg-info/10 py-2 pr-3 pl-3 text-sm text-muted-foreground italic"
                    >
                      "{data.selectedText}"
                    </div>
                    <div>{data.question}</div>
                  </div>
                {:else if dataType === "ask-help" && dataPart && "data" in dataPart}
                  <!-- Ask help - show formatted -->
                  {@const data = dataPart.data as UserDataParts["ask-help"]}
                  <div class="flex flex-col gap-2">
                    <div class="text-sm text-muted-foreground">
                      Help requested for: <span
                        class="font-medium text-foreground"
                        >{data.question}</span
                      >
                    </div>
                    {#if data.currentAnswer.trim()}
                      <div class="text-sm">
                        <span class="text-muted-foreground">My attempt:</span>
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
                <Card class="flex flex-row items-center gap-3 bg-muted/50">
                  <Loader />
                  <span class="text-sm font-medium">Editing document...</span>
                </Card>
              {:else}
                {@const result = part.output}
                <Card class="bg-muted/50">
                  {#if result?.success}
                    <div class="flex flex-row items-center gap-2">
                      <SquareCheck class="size-4 text-success" />
                      <span class="text-sm font-medium">
                        Document updated successfully
                      </span>
                    </div>
                    <p class="m-0 text-sm text-muted-foreground">
                      {result.summary}
                    </p>
                  {:else}
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-sm font-medium text-destructive">
                        Failed to update document
                      </span>
                    </div>
                    <p class="m-0 text-sm text-muted-foreground">
                      {result?.error ?? "No response from edit tool."}
                    </p>
                  {/if}
                </Card>
              {/if}
            {:else if part.type === "tool-append_document"}
              {#if part.state === "input-streaming"}
                <Card class="flex flex-row items-center gap-3 bg-muted/50">
                  <Loader />
                  <span class="text-sm font-medium">
                    Appending to document...
                  </span>
                </Card>
              {:else}
                {@const result = part.output}
                <Card class="bg-muted/50">
                  <div class="flex flex-row items-center gap-2">
                    <SquareCheck class="size-4 text-success" />
                    <span class="text-sm font-medium">
                      Content appended to document
                    </span>
                  </div>
                  <p class="m-0 text-sm text-muted-foreground">
                    {result?.summary}
                  </p>
                </Card>
              {/if}
            {:else if part.type === "tool-generate_options"}
              {#if part.state === "input-streaming"}
                <Loader />
              {/if}
            {:else if part.type === "tool-prompt_student"}
              {@const isLastMessage = messageIndex === chat.messages.length - 1}
              {#if part.state === "input-streaming" || part.state === "input-available"}
                <Card class="flex flex-row items-center gap-3 bg-muted/50">
                  <Loader />
                  <span class="text-sm font-medium">Setting up question...</span
                  >
                </Card>
              {:else if part.state === "output-available"}
                <ChatPromptBlock
                  data={part.output}
                  isActive={isLastMessage && !isGenerating}
                  {isLastMessage}
                  onSuccess={handlePromptSuccess}
                />
              {:else}
                <Card class="flex flex-row items-center gap-3 bg-muted/50">
                  <span class="text-sm font-medium text-destructive">
                    Error occurred while setting up the question
                  </span>
                </Card>
              {/if}
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

      <div
        class="sticky bottom-0 -mx-12 -mt-6 flex flex-col gap-6 bg-linear-to-b from-transparent from-0% via-background via-10% to-background px-12 pt-6 pb-12"
      >
        {@render role_tag("user")}
        {#if lastPart?.type === "tool-generate_options" && lastPart.state === "output-available"}
          {@const options = lastPart.output.options}
          <div class="-mb-2 flex flex-wrap gap-2">
            {#each options as option}
              <Button
                onclick={() => sendFollowUpOption(option.label, option.value)}
                disabled={isGenerating}
                variant="outline"
              >
                {option.label}
              </Button>
            {/each}
          </div>
        {/if}
        <div class="flex gap-3">
          <Textarea
            bind:value={inputValue}
            onkeydown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isGenerating}
            class="min-h-20"
            autofocus
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
    {:else}
      <div class="min-h-6"></div>
    {/if}
  </div>
</div>
