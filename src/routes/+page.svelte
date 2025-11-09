<script lang="ts">
  import ChatPanel from "$components/chat/ChatPanel.svelte";
  import type { Message, AIResponse } from "$types/ai";
  import { applyEdits } from "$lib/documentEditor";
  import { SAMPLE_CONTENT } from "$lib/sampleContent";
  import DocumentEditor from "$components/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";

  let documentContent = $state(SAMPLE_CONTENT);
  let chatHistory = $state<Message[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  async function handleSendMessage(userQuestion: string) {
    // Clear any existing errors
    error = null;

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
      error =
        err instanceof Error ? err.message : "An unexpected error occurred";
    } finally {
      isLoading = false;
    }
  }

  function handleClearError() {
    error = null;
  }
</script>

<div class="flex h-screen flex-col">
  <div class="border-b px-8 py-6">
    <h1 class="m-0 mb-1 text-2xl font-bold text-gray-900">AI Office Hour</h1>
    <p class="m-0 text-sm text-gray-600">
      Upload your assignment and ask questions to understand it better
    </p>
  </div>

  <div class="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
    <div class="flex flex-col overflow-hidden border-r">
      <div class="border-b px-8 py-6">
        <h2
          class="m-0 text-base font-semibold tracking-wide text-gray-700 uppercase"
        >
          Document
        </h2>
      </div>
      <div class="flex-1 p-6">
        <Card class="h-full">
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
          {isLoading}
          {error}
          onsend={handleSendMessage}
          onclearerror={handleClearError}
        />
      </div>
    </div>
  </div>
</div>
