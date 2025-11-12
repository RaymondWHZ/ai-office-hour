<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "$lib/types/ai";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Loader } from "$lib/components/ui/loader";
  import { START_OPTIONS } from "$lib/constants/startOptions";

  interface Props {
    messages: Message[];
    isLoading: boolean;
    inputValue?: string;
    onsend: (message: string) => void;
  }

  let {
    messages,
    isLoading,
    inputValue = $bindable(""),
    onsend,
  }: Props = $props();

  // eslint-disable-next-line no-unassigned-vars
  let messagesContainer: HTMLDivElement | undefined;

  function handleSend() {
    const trimmed = inputValue.trim();
    if (trimmed && !isLoading) {
      onsend(trimmed);
      inputValue = "";
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleOptionClick(value: string) {
    if (!isLoading) {
      onsend(value);
    }
  }

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    if (messagesContainer && messages.length > 0) {
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
              class="cursor-pointer select-none"
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
      <div class="flex flex-col gap-2">
        <div
          class="text-xs font-semibold tracking-wide uppercase {message.role ===
          'user'
            ? 'text-indigo-500'
            : 'text-emerald-600'}"
        >
          {message.role === "user" ? "You" : "AI Teaching Assistant"}
        </div>
        <Card>
          {#if message.role === "assistant"}
            <Markdown
              class="prose max-w-none"
              value={message.content.explanation}
            />
          {:else}
            {message.content}
          {/if}
        </Card>
        {#if message.role === "assistant" && message.content.options && message.content.options.length > 0}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each message.content.options as option}
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

    {#if isLoading}
      <div class="flex flex-col gap-2">
        <div
          class="text-xs font-semibold tracking-wide text-emerald-600 uppercase"
        >
          AI Teaching Assistant
        </div>
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
</div>
