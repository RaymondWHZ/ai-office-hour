<script lang="ts">
  import {
    sessionState,
    createSession,
    updateSession,
    type SessionData,
    getActiveSession,
  } from "$lib/stores/sessionStore.svelte";
  import { SAMPLE_CONTENT } from "$lib/constants/sampleContent";
  import TutoringView from "$lib/components/sections/views/TutoringView.svelte";
  import SessionSwitcher from "$lib/components/sections/views/SessionSwitcher.svelte";
  import { untrack } from "svelte";
  import WelcomeView from "$lib/components/sections/views/WelcomeView.svelte";

  const createEmptySession = () => ({
    documentContent: "",
    chatHistory: [],
    inputValue: "",
  });

  const createExampleSession = () => ({
    documentContent: SAMPLE_CONTENT,
    chatHistory: [],
    inputValue: "",
  });

  let currentSession = $state<SessionData | undefined>();
  const activeSessionId = $derived(sessionState.activeSessionId);

  $effect(() => {
    void sessionState.activeSessionId;
    currentSession = untrack(() => getActiveSession());
  });

  $effect(() => {
    if (!currentSession) return;

    // Reference properties to track changes
    void currentSession.chatHistory;
    void currentSession.documentContent;
    void currentSession.inputValue;

    if (untrack(() => activeSessionId)) {
      // Debounced update for existing session
      const timer = setTimeout(() => {
        if (activeSessionId && currentSession) {
          updateSession(activeSessionId, currentSession);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else if (currentSession.chatHistory.length > 0) {
      // If in a new session and there's content, create a new session
      createSession(currentSession);
    }
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
      <SessionSwitcher />
    </div>
  </div>

  {#if currentSession}
    <TutoringView
      bind:documentContent={currentSession.documentContent}
      bind:chatHistory={currentSession.chatHistory}
      bind:inputValue={currentSession.inputValue}
    />
  {:else}
    <WelcomeView
      onStartEmpty={() => (currentSession = createEmptySession())}
      onStartExample={() => (currentSession = createExampleSession())}
    />
  {/if}
</div>
