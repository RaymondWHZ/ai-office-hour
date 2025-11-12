<script lang="ts">
  import { applyEdits } from "$lib/documentEditor";
  import type { AIResponse, Message } from "$lib/types/ai";
  import { toast } from "svelte-sonner";
  import { Card } from "$lib/components/ui/card";
  import ChatPanel from "$lib/components/sections/chat/ChatPanel.svelte";
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";

  interface Props {
    documentContent: string;
    chatHistory: Message[];
    inputValue: string;
  }

  let {
    documentContent = $bindable(),
    chatHistory = $bindable(),
    inputValue = $bindable(),
  }: Props = $props();

  let isLoading = $state(false);

  async function handleSendMessage(userQuestion: string) {
    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: userQuestion,
    };
    chatHistory = [...chatHistory, userMessage];

    // Set loading state
    isLoading = true;

    try {
      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentContent,
          userQuestion,
          chatHistory: chatHistory.slice(0, -1), // Don't include the message we just added
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const aiResponse: AIResponse = await response.json();

      // Apply edits to document
      if (aiResponse.edits && aiResponse.edits.length > 0) {
        try {
          documentContent = applyEdits(documentContent, aiResponse.edits);
        } catch (editError) {
          console.error("Error applying edits:", editError);
          // Continue even if edits fail - still show the explanation
        }
      }

      // Add AI explanation to chat
      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
      };
      chatHistory = [...chatHistory, assistantMessage];
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
        {
          richColors: true,
        },
      );
    } finally {
      isLoading = false;
    }
  }
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
    <div class="flex-1 overflow-hidden">
      <ChatPanel
        messages={chatHistory}
        bind:inputValue
        {isLoading}
        onsend={handleSendMessage}
      />
    </div>
  </div>
</div>
