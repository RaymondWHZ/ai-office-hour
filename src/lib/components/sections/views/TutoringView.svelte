<script lang="ts">
  import { applyEdits } from "$lib/documentEditor";
  import type { Message } from "$lib/types/ai";
  import {
    extractExplanationFromMessage,
    extractOptionsFromMessage,
  } from "$lib/types/ai";
  import { toast } from "svelte-sonner";
  import { Card } from "$lib/components/ui/card";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import { Loader } from "$lib/components/ui/loader";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Chat } from "@ai-sdk/svelte";
  import { onMount } from "svelte";
  import { START_OPTIONS } from "$lib/constants/startOptions";

  interface Props {
    documentContent: string;
  }

  let { documentContent = $bindable() }: Props = $props();

  let inputValue = $state("");
  let messagesContainer: HTMLDivElement;

  // Track detailed loading states
  let loadingState = $state<
    "idle" | "thinking" | "editing" | "generating-options"
  >("idle");

  // Initialize Chat instance with onData callback to handle tool results
  const chat = new Chat({
    onData: (dataPart) => {
      console.log("Received data part:", dataPart);

      // Handle loading state updates from API
      if (dataPart.type === "data-loading-state" && dataPart.data) {
        const data = dataPart.data as any;
        if (data.state) {
          loadingState = data.state;
          console.log("Loading state updated to:", data.state);
        }
      }

      // Handle edit_document tool results
      if (dataPart.type === "data-edit_document" && dataPart.data) {
        const data = dataPart.data as any;
        if (data.edits && Array.isArray(data.edits)) {
          try {
            console.log("Applying edits from onData:", data.edits);
            documentContent = applyEdits(documentContent, data.edits);
          } catch (editError) {
            console.error("Error applying edits:", editError);
            toast.error("Failed to apply some edits to the document", {
              richColors: true,
            });
          }
        }
      }
    },
  });

  // Watch chat status and update loading state
  $effect(() => {
    const status = chat.status;

    if (status === "ready") {
      // Reset to idle when chat is done
      loadingState = "idle";
    } else if (status === "streaming" || status === "submitted") {
      // Set to thinking when starting
      if (loadingState === "idle") {
        loadingState = "thinking";
      }
    }
  });

  // Convert Chat messages to our Message format for display
  const displayMessages = $derived(
    chat.messages.map((msg) => {
      if (msg.role === "user") {
        const textPart = msg.parts.find((p) => p.type === "text");
        return {
          role: "user" as const,
          content: textPart && "text" in textPart ? textPart.text : "",
        };
      } else if (msg.role === "assistant") {
        const textPart = msg.parts.find((p) => p.type === "text");
        const textContent = textPart && "text" in textPart ? textPart.text : "";

        const toolInvocations = msg.parts
          .filter((p) => p.type.startsWith("tool-"))
          .map((part: any) => {
            if ("toolCallId" in part && "toolName" in part) {
              return {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                args: ("input" in part ? part.input : {}) as Record<
                  string,
                  unknown
                >,
                result: ("output" in part ? part.output : undefined) as
                  | Record<string, unknown>
                  | undefined,
                state: ("output" in part ? "result" : "call") as
                  | "call"
                  | "result"
                  | "partial-call",
              };
            }
            return null;
          })
          .filter(Boolean);

        return {
          role: "assistant" as const,
          content: textContent,
          toolInvocations:
            toolInvocations.length > 0 ? (toolInvocations as any) : undefined,
        };
      }
      return {
        role: "system" as const,
        content: "",
      };
    }),
  );

  // Derive loading state
  const isLoading = $derived(
    chat.status === "streaming" || chat.status === "submitted",
  );

  // Handle sending messages
  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !isLoading) {
      try {
        chat.sendMessage(
          { text: trimmed },
          {
            body: {
              documentContent,
            },
          },
        );
        inputValue = "";
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(
          error instanceof Error ? error.message : "An error occurred",
          {
            richColors: true,
          },
        );
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOptionClick = (value: string) => {
    if (!isLoading) {
      inputValue = value;
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    void displayMessages.length;

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

<div class="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
  <div class="flex flex-col overflow-hidden border-r">
    <div class="border-b px-8 py-6">
      <h2
        class="m-0 text-base font-semibold tracking-wide text-gray-700 uppercase"
      >
        Document
      </h2>
    </div>
    <div class="flex-1 overflow-hidden p-6">
      <Card class="h-full overflow-hidden p-0">
        <DocumentEditor bind:value={documentContent} />
      </Card>
    </div>
  </div>

  <div class="flex flex-col overflow-hidden">
    <div class="border-b px-8 py-6">
      <h2
        class="m-0 text-base font-semibold tracking-wide text-gray-700 uppercase"
      >
        Chat
      </h2>
    </div>
    <div class="flex h-full flex-col">
      <div
        class="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
        bind:this={messagesContainer}
      >
        {#if displayMessages.length === 0}
          <div
            class="flex h-full flex-col items-center justify-center gap-6 px-6"
          >
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
                  onclick={() => handleOptionClick(option.prompt)}
                >
                  <span class="text-lg font-semibold">{option.title}</span>
                  <span class="text-sm">{option.description}</span>
                </Card>
              {/each}
            </div>
          </div>
        {/if}

        {#each displayMessages as message, index}
          {@const isLastAssistantMessage =
            message.role === "assistant" &&
            index ===
              displayMessages.findLastIndex((m) => m.role === "assistant")}
          {@const options =
            message.role === "assistant"
              ? extractOptionsFromMessage(message as any)
              : []}
          {@const displayText =
            message.role === "assistant"
              ? extractExplanationFromMessage(message as any)
              : message.content}
          {@const hasContent = displayText.trim().length > 0}

          <div class="flex flex-col gap-2">
            <div
              class="text-xs font-semibold tracking-wide uppercase {message.role ===
              'user'
                ? 'text-indigo-500'
                : 'text-emerald-600'}"
            >
              {message.role === "user" ? "You" : "AI Teaching Assistant"}
            </div>

            <!-- Only show message card if there's content -->
            {#if hasContent}
              <Card>
                {#if message.role === "assistant"}
                  <Markdown class="prose max-w-none" value={displayText} />
                {:else}
                  {displayText}
                {/if}
              </Card>
            {/if}

            <!-- Options -->
            {#if message.role === "assistant" && options.length > 0}
              <div class="mt-3 flex flex-wrap gap-2">
                {#each options as option}
                  <Button
                    onclick={() => handleOptionClick(option.value)}
                    disabled={isLoading || !isLastAssistantMessage}
                    variant="outline"
                  >
                    {option.label}
                  </Button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}

        <!-- Loading indicator -->
        {#if isLoading}
          <div class="flex items-center gap-2 px-2 py-3 text-sm text-gray-500">
            <Loader />
            <span>
              {#if loadingState === "thinking"}
                Thinking...
              {:else if loadingState === "editing"}
                Editing document...
              {:else if loadingState === "generating-options"}
                Generating options...
              {:else}
                Processing...
              {/if}
            </span>
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
    </div>
  </div>
</div>
