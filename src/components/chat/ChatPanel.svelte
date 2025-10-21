<script lang="ts">
  import { onMount } from "svelte";
  import type { Message } from "../../types/ai";
  import LoadingIndicator from "./LoadingIndicator.svelte";
  import ErrorMessage from "./ErrorMessage.svelte";
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

<div class="flex h-full flex-col bg-gray-50">
  <div
    class="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
    bind:this={messagesContainer}
  >
    {#if error && onclearerror}
      <ErrorMessage message={error} ondismiss={onclearerror} />
    {/if}

    {#if messages.length === 0 && !error}
      <div
        class="flex h-full items-center justify-center text-sm text-gray-400"
      >
        <p class="m-0">Ask a question about your assignment!</p>
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
        <div
          class="rounded-lg px-4 py-3 leading-relaxed {message.role === 'user'
            ? 'max-w-[80%] self-start bg-indigo-50 text-indigo-950'
            : 'border border-gray-200 bg-white text-gray-800'}"
        >
          {#if message.role === "user"}
            {message.content}
          {:else}
            <TAResponseRenderer value={message.content} />
          {/if}
        </div>
        {#if message.role === "assistant" && message.options && message.options.length > 0}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each message.options as option}
              <button
                onclick={() => handleOptionClick(option.value)}
                disabled={isLoading || !isLastAssistantMessage}
                class="cursor-pointer rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {option.label}
              </button>
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
        <LoadingIndicator />
      </div>
    {/if}
  </div>

  <div class="flex gap-3 border-t border-gray-200 bg-white p-4 px-6">
    <textarea
      bind:value={inputValue}
      onkeydown={handleKeyDown}
      placeholder="Ask a question..."
      disabled={isLoading}
      rows="3"
      class="font-inherit flex-1 resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
    ></textarea>
    <button
      onclick={handleSend}
      disabled={isLoading || !inputValue.trim()}
      class="cursor-pointer self-end rounded-lg border-none bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      Ask
    </button>
  </div>
</div>
