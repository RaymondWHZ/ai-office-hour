<script lang="ts">
  import { onMount } from "svelte";
  import MarkdownEditor from "./MarkdownEditor.svelte";
  import ChatPanel from "./ChatPanel.svelte";
  import type { Message, AIResponse } from "../types/ai";
  import { applyEdits } from "../lib/documentEditor";
  import { SAMPLE_CONTENT } from "../lib/sampleContent";
  import TipTap from "./TipTap.svelte";

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
        content: aiResponse.explanation,
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

<div class="h-screen flex flex-col bg-white">
  <div class="py-6 px-8 border-b-2 border-gray-200 bg-gray-50">
    <h1 class="m-0 mb-1 text-2xl font-bold text-gray-900">AI Office Hour</h1>
    <p class="m-0 text-sm text-gray-600">
      Upload your assignment and ask questions to understand it better
    </p>
  </div>

  <div class="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
    <div
      class="flex flex-col overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-gray-200"
    >
      <div class="py-4 px-6 border-b border-gray-200 bg-gray-50">
        <h2
          class="m-0 text-base font-semibold text-gray-700 uppercase tracking-wide"
        >
          Document
        </h2>
      </div>
      <div class="flex-1 overflow-hidden">
        <MarkdownEditor bind:value={documentContent} />
        <!-- <TipTap /> -->
      </div>
    </div>

    <div class="flex flex-col overflow-hidden">
      <div class="py-4 px-6 border-b border-gray-200 bg-gray-50">
        <h2
          class="m-0 text-base font-semibold text-gray-700 uppercase tracking-wide"
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
