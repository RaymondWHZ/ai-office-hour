<script lang="ts">
  import { onMount } from "svelte";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Loader } from "$lib/components/ui/loader";
  import { START_OPTIONS } from "$lib/constants/startOptions";
  import { Chat } from "@ai-sdk/svelte";
  import type { TutorMessage } from "$lib/tools";
  import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
  import { applyEdits } from "$lib/documentEditor";
  import { SquareCheck } from "@lucide/svelte";

  interface Props {
    documentContent?: string;
    messages?: TutorMessage[];
    inputValue?: string;
  }

  let {
    documentContent = $bindable(""),
    messages = $bindable([]),
    inputValue = $bindable(""),
  }: Props = $props();

  // eslint-disable-next-line no-unassigned-vars -- This will be binded to the messages container div
  let messagesContainer: HTMLDivElement;

  // Initialize Chat instance with onData callback to handle tool results
  const chat = new Chat<TutorMessage>({
    messages,

    sendAutomaticallyWhen: ({ messages }) => {
      // If the last message is generating options, do not continue automatically
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "assistant") return false;
      const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
      if (lastPart.type === "tool-generate_options") return false;

      return lastAssistantMessageIsCompleteWithToolCalls({ messages });
    },

    // run client-side tools that are automatically executed:
    async onToolCall({ toolCall }) {
      // Check if it's a dynamic tool first for proper type narrowing
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === "edit_document") {
        const { edits, summary } = toolCall.input;
        try {
          documentContent = applyEdits(documentContent, edits);
          chat.addToolOutput({
            tool: "edit_document",
            toolCallId: toolCall.toolCallId,
            output: {
              success: true,
              summary,
            },
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
    },
  });

  // Derive loading state
  const isLoading = $derived(
    chat.status === "streaming" || chat.status === "submitted",
  );

  // Derive the last part of the last assistant message
  const lastPart = $derived.by(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return null;
    return lastMessage.parts[lastMessage.parts.length - 1];
  });

  // Derive if the last part is in a loading state
  const lastPartIsLoading = $derived.by(() => {
    if (!lastPart) return false;
    const status = "state" in lastPart ? lastPart.state : undefined;
    return status === "streaming" || status === "input-streaming";
  });

  // Handle sending messages
  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !isLoading) {
      chat.sendMessage(
        { text: trimmed },
        {
          body: {
            documentContent,
          },
        },
      );
      inputValue = "";
    }
  };

  // Handle Enter key for sending messages
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle clicking on an option
  const handleClickOption = (value: string) => {
    if (!isLoading) {
      inputValue = value;
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    void lastPart;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  // Initial scroll to bottom on mount
  onMount(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
</script>

<div
  class="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
  bind:this={messagesContainer}
>
  {#if chat.messages.length === 0}
    <div class="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div class="text-center">
        <p class="m-0 mb-2 text-lg font-semibold text-gray-700">
          How would you like to start?
        </p>
        <p class="m-0 text-sm text-gray-500">
          Choose a learning style to begin exploring your assignment
        </p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row">
        {#each START_OPTIONS as option}
          <Card
            class="cursor-pointer transition-all select-none hover:shadow-md"
            onclick={() => handleClickOption(option.prompt)}
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

      <!-- Render each part in order -->
      {#each message.parts as part}
        {#if part.type === "text" && "text" in part && part.text.trim()}
          <Card>
            {#if message.role === "assistant"}
              <Markdown class="prose max-w-none" value={part.text} />
            {:else}
              {part.text}
            {/if}
          </Card>
        {:else if part.type === "tool-edit_document"}
          {#if part.state === "input-streaming"}
            <!-- Loading: Generating edits -->
            <Card class="flex flex-row items-center gap-3">
              <Loader />
              <span class="font-medium">Editing document...</span>
            </Card>
          {:else}
            {@const result = part.output}
            <!-- Edit result indicator -->
            <Card class="flex flex-col gap-2">
              {#if result?.success}
                <div class="flex flex-row items-center gap-3">
                  <SquareCheck />
                  <span class="font-medium">
                    Document updated successfully
                  </span>
                </div>
                <p class="m-0 text-sm text-gray-600">
                  {result.summary}
                </p>
              {:else}
                <div class="flex flex-row items-center gap-3">
                  <span class="font-medium text-red-600">
                    Failed to update document
                  </span>
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
            <!-- Loading: Generating options -->
            <Card class="flex flex-row items-center gap-3">
              <Loader />
              <span class="font-medium">Generating options...</span>
            </Card>
          {:else if options && options.length > 0}
            <!-- Options -->
            <div class="flex flex-wrap gap-2">
              {#each options as option}
                <Button
                  onclick={() => handleClickOption(option.value)}
                  disabled={isLoading || !isLastMessage}
                  variant="outline"
                >
                  {option.label}
                </Button>
              {/each}
            </div>
          {/if}
        {/if}
      {/each}
    </div>
  {/each}

  <!-- Global loading indicator -->
  {#if isLoading && !lastPartIsLoading}
    <div class="px-2 py-3">
      <Loader />
    </div>
  {/if}
</div>

<div class="flex gap-3 border-t bg-white p-6">
  <Textarea
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    placeholder="Ask a question..."
    disabled={isLoading}
  />
  <Button onclick={handleSend} disabled={isLoading || !inputValue.trim()}>
    Ask
  </Button>
</div>
