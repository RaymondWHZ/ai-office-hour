<script lang="ts">
  import { onMount } from "svelte";
  import ChatPanel from "$lib/components/sections/chat/ChatPanel.svelte";
  import type { AIResponse, Message } from "$lib/types/ai";
  import { applyEdits } from "$lib/documentEditor";
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import {
    sessionState,
    getActiveSession,
    formatSessionName,
    loadFromStorage,
    switchSession,
    deleteSession,
    upsertSession,
    type SessionData,
  } from "$lib/stores/sessionStore.svelte";
  import { PlusIcon, TrashIcon } from "@lucide/svelte";
  import { SAMPLE_CONTENT } from "$lib/constants/sampleContent";

  const createDefaultSession = () => ({
    documentContent: SAMPLE_CONTENT,
    chatHistory: [],
    inputValue: "",
  });

  let isLoading = $state(false);
  let currentSession = $state<SessionData>(createDefaultSession());
  let error = $state<string | null>(null);

  // Derived values
  const sessions = $derived(sessionState.sessions);
  const activeSessionId = $derived(sessionState.activeSessionId);
  const activeSession = $derived(getActiveSession(sessionState));

  // Load sessions from storage on mount
  onMount(() => {
    loadFromStorage();
    currentSession = getActiveSession(sessionState) ?? currentSession;
  });

  // Auto-save current input value
  // $effect(() => {
  //   if (activeSessionId) {
  //     updateSession(activeSessionId, {
  //       inputValue,
  //     });
  //   }
  // });

  async function handleSendMessage(userQuestion: string) {
    // Clear any existing errors
    error = null;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: userQuestion,
    };
    currentSession.chatHistory.push(userMessage);

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
          documentContent: currentSession.documentContent,
          userQuestion,
          chatHistory: currentSession.chatHistory.slice(0, -1), // Don't include the message we just added
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
          currentSession.documentContent = applyEdits(
            currentSession.documentContent,
            aiResponse.edits,
          );
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
      currentSession.chatHistory.push(assistantMessage);

      // Update session
      upsertSession(currentSession);
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

  function handleNewSession() {
    // Enter virtual state
    sessionState.activeSessionId = null;
    // Reset to defaults
    currentSession = createDefaultSession();
  }

  function handleSessionChange(sessionId: string) {
    switchSession(sessionId === "" ? null : sessionId);
    currentSession = getActiveSession(sessionState) ?? createDefaultSession();
  }

  function handleDeleteSession() {
    if (!activeSessionId) {
      // Can't delete a virtual session
      return;
    }

    if (sessions.length === 1) {
      // Deleting the last session - enter virtual state
      if (
        confirm(
          "This is your last session. Deleting it will start a new session. Continue?",
        )
      ) {
        deleteSession(activeSessionId);
        sessionState.activeSessionId = null;
        currentSession = createDefaultSession();
      }
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete this session? This action cannot be undone.",
      )
    ) {
      const currentIndex = sessions.findIndex((s) => s.id === activeSessionId);
      deleteSession(activeSessionId);

      // Switch to another session after deletion
      const newIndex = Math.min(currentIndex, sessions.length - 1);
      sessionState.activeSessionId = sessions[newIndex].id;
    }
  }
</script>

<div class="flex h-screen flex-col">
  <div class="border-b px-8 py-6">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <h1 class="m-0 mb-1 text-2xl font-bold text-gray-900">
          AI Office Hour
        </h1>
        <p class="m-0 text-sm text-gray-600">
          Upload your assignment and ask questions to understand it better
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Select.Root
          type="single"
          value={activeSessionId ?? ""}
          onValueChange={handleSessionChange}
        >
          <Select.Trigger class="w-[280px]">
            {activeSession ? formatSessionName(activeSession) : "New Session"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={""}>New Session</Select.Item>
            {#each sessions as session}
              <Select.Item value={session.id}
                >{formatSessionName(session)}</Select.Item
              >
            {/each}
          </Select.Content>
        </Select.Root>
        <Button onclick={handleNewSession} variant="outline" size="icon">
          <PlusIcon class="h-4 w-4" />
        </Button>
        <Button
          onclick={handleDeleteSession}
          variant="outline"
          size="icon"
          disabled={!activeSessionId}
        >
          <TrashIcon class="h-4 w-4" />
        </Button>
      </div>
    </div>
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
          <DocumentEditor bind:value={currentSession.documentContent} />
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
          messages={currentSession.chatHistory}
          bind:inputValue={currentSession.inputValue}
          {isLoading}
          {error}
          onsend={handleSendMessage}
          onclearerror={handleClearError}
        />
      </div>
    </div>
  </div>
</div>
