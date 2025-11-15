<script lang="ts">
  import { applyEdits } from "$lib/documentEditor";
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
  import { SquareCheck } from "@lucide/svelte";

  interface Props {
    documentContent: string;
  }

  let { documentContent = $bindable() }: Props = $props();

  let inputValue = $state("");
  let messagesContainer: HTMLDivElement;

  // Initialize Chat instance with onData callback to handle tool results
  const chat = new Chat({
    onData: (dataPart) => {
      console.log("Received data part:", dataPart);

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

  // Derive loading state
  const isLoading = $derived(
    chat.status === "streaming" || chat.status === "submitted",
  );

  const lastPart = $derived.by(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return null;
    return lastMessage.parts[lastMessage.parts.length - 1];
  });

  const lastPartIsLoading = $derived.by(() => {
    if (!lastPart) return false;
    const status = "state" in lastPart ? lastPart.state : undefined;
    return status === "streaming" || status === "input-streaming";
  });

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
    void chat.messages.length;

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
        {#if chat.messages.length === 0}
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
                <Card class="flex flex-row items-center gap-3">
                  {#if part.state === "input-streaming"}
                    <!-- Loading: Generating edits -->
                    <Loader />
                    <span class="font-medium">Editing document...</span>
                  {:else}
                    <!-- Edit success indicator -->
                    <SquareCheck />
                    <span class="font-medium">
                      Document updated successfully
                    </span>
                  {/if}
                </Card>
              {:else if part.type === "tool-generate_options"}
                {@const options =
                  "output" in part
                    ? (part.output?.options as
                        | Array<{ label: string; value: string }>
                        | undefined)
                    : undefined}
                {@const isLastMessage =
                  messageIndex === chat.messages.length - 1}

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
                        onclick={() => handleOptionClick(option.value)}
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
    </div>
  </div>
</div>
