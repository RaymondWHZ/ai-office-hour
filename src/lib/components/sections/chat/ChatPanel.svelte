<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "$lib/types/ai";
  import {
    extractExplanationFromMessage,
    extractOptionsFromMessage,
  } from "$lib/types/ai";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Loader } from "$lib/components/ui/loader";
  import { START_OPTIONS } from "$lib/constants/startOptions";

  interface Props {
    messages: Message[];
    isLoading: boolean;
    loadingState?: "idle" | "thinking" | "editing" | "generating-options";
    inputValue?: string;
    onsend: (message: string) => void;
  }

  let {
    messages,
    isLoading,
    loadingState = "idle",
    inputValue = $bindable(""),
    onsend,
  }: Props = $props();

  let messagesContainer: HTMLDivElement;

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !isLoading) {
      onsend(trimmed);
      inputValue = "";
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
      onsend(value);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    void messages.length;

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

<div class="flex h-full flex-col">
  <div
    class="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
    bind:this={messagesContainer}
  >
    {#if messages.length === 0}
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
              onclick={() => handleOptionClick(option.prompt)}
            >
              <span class="text-lg font-semibold">{option.title}</span>
              <span class="text-sm">{option.description}</span>
            </Card>
          {/each}
        </div>
      </div>
    {/if}

    {#each messages as message, index}
      {@const isLastAssistantMessage =
        message.role === "assistant" &&
        index === messages.findLastIndex((m) => m.role === "assistant")}
      {@const options =
        message.role === "assistant" ? extractOptionsFromMessage(message) : []}
      {@const displayText =
        message.role === "assistant"
          ? extractExplanationFromMessage(message)
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

    <!-- Loading indicator beneath all messages (like Claude Code) -->
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
