<script lang="ts">
  import {
    sessionState,
    createSession,
    updateSession,
    type SessionData,
    getActiveSession,
    loadFromStorage,
  } from "$lib/stores/sessionStore.svelte";
  import { SAMPLE_CONTENT } from "$lib/constants/sampleContent";
  import TutoringView from "$lib/components/sections/views/TutoringView.svelte";
  import SessionSwitcher from "$lib/components/sections/views/SessionSwitcher.svelte";
  import { onMount, untrack } from "svelte";

  const createDefaultSession = () => ({
    documentContent: SAMPLE_CONTENT,
    chatHistory: [],
    inputValue: "",
  });

  let currentSession = $state<SessionData>(createDefaultSession());
  const activeSessionId = $derived(sessionState.activeSessionId);

  const syncSession = () => {
    currentSession = getActiveSession() ?? createDefaultSession();
  };

  onMount(() => {
    loadFromStorage();
    syncSession();
  });

  $effect(() => {
    // Reference properties to track changes
    void currentSession.chatHistory;
    void currentSession.documentContent;
    void currentSession.inputValue;

    let timer: number | undefined;
    if (untrack(() => activeSessionId)) {
      timer = setTimeout(() => {
        // Trigger Svelte reactivity
        console.log("Auto-saving session:", activeSessionId);
        updateSession(activeSessionId!, currentSession);
      }, 500);
    } else if (currentSession.chatHistory.length > 0) {
      // If in a new session and there's content, create a new session
      createSession(currentSession);
    }

    return () => {
      clearTimeout(timer);
    };
  });
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
      <SessionSwitcher onSessionChange={syncSession} />
    </div>
  </div>

  <TutoringView
    bind:documentContent={currentSession.documentContent}
    bind:chatHistory={currentSession.chatHistory}
    bind:inputValue={currentSession.inputValue}
  />
</div>
