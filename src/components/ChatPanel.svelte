<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "../types/ai";
  import LoadingIndicator from "./LoadingIndicator.svelte";
  import ErrorMessage from "./ErrorMessage.svelte";
  import { Markdown } from "carta-md";
  import TAResponseRenderer from "./TAResponseRenderer.svelte";

  interface Props {
    messages: Message[];
    isLoading: boolean;
    error?: string | null;
    onsend: (message: string) => void;
    onclearerror?: () => void;
  }

  let {
    messages,
    isLoading,
    error = null,
    onsend,
    onclearerror,
  }: Props = $props();

  let inputValue = $state("");
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

<div class="h-full flex flex-col bg-gray-50">
  <div
    class="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
    bind:this={messagesContainer}
  >
    {#if error && onclearerror}
      <ErrorMessage message={error} ondismiss={onclearerror} />
    {/if}

    {#if messages.length === 0 && !error}
      <div
        class="flex items-center justify-center h-full text-gray-400 text-sm"
      >
        <p class="m-0">Ask a question about your assignment!</p>
      </div>
    {/if}

    {#each messages as message}
      <div class="flex flex-col gap-2">
        <div
          class="text-xs font-semibold uppercase tracking-wide {message.role ===
          'user'
            ? 'text-indigo-500'
            : 'text-emerald-600'}"
        >
          {message.role === "user" ? "You" : "AI Teaching Assistant"}
        </div>
        <div
          class="py-3 px-4 rounded-lg leading-relaxed {message.role === 'user'
            ? 'bg-indigo-50 text-indigo-950 self-start max-w-[80%]'
            : 'bg-white text-gray-800 border border-gray-200'}"
        >
          {#if message.role === "user"}
            {message.content}
          {:else}
            <TAResponseRenderer value={message.content} />
          {/if}
        </div>
      </div>
    {/each}

    {#if isLoading}
      <div class="flex flex-col gap-2">
        <div
          class="text-xs font-semibold uppercase tracking-wide text-emerald-600"
        >
          AI Teaching Assistant
        </div>
        <LoadingIndicator />
      </div>
    {/if}
  </div>

  <div class="p-4 px-6 border-t border-gray-200 bg-white flex gap-3">
    <textarea
      bind:value={inputValue}
      onkeydown={handleKeyDown}
      placeholder="Ask a question..."
      disabled={isLoading}
      rows="3"
      class="flex-1 p-3 border border-gray-300 rounded-lg font-inherit text-sm resize-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
    ></textarea>
    <button
      onclick={handleSend}
      disabled={isLoading || !inputValue.trim()}
      class="py-3 px-6 bg-blue-500 text-white border-none rounded-lg font-semibold cursor-pointer transition-colors self-end hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      Ask
    </button>
  </div>
</div>
