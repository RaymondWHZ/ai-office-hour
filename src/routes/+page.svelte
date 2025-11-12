<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import {
    sessionState,
    getActiveSession,
    formatSessionName,
    loadFromStorage,
    switchSession,
    deleteSession,
    createSession,
    updateSession,
    type SessionData,
  } from "$lib/stores/sessionStore.svelte";
  import { PlusIcon, TrashIcon } from "@lucide/svelte";
  import { SAMPLE_CONTENT } from "$lib/constants/sampleContent";
  import * as Popover from "$lib/components/ui/popover";
  import TutoringView from "$lib/components/sections/TutoringView.svelte";

  const createDefaultSession = () => ({
    documentContent: SAMPLE_CONTENT,
    chatHistory: [],
    inputValue: "",
  });

  let currentSession = $state<SessionData>(createDefaultSession());

  // Derived values
  const sessions = $derived(sessionState.sessions);
  const activeSessionId = $derived(sessionState.activeSessionId);
  const activeSession = $derived(getActiveSession(sessionState));

  // Load sessions from storage on mount
  onMount(() => {
    loadFromStorage();
    currentSession = getActiveSession(sessionState) ?? currentSession;
  });

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
    if (activeSessionId) {
      deleteSession(activeSessionId);
      sessionState.activeSessionId = null;
      currentSession = createDefaultSession();
    }
  }

  let timer: number | undefined = undefined;
  $effect(() => {
    // Debounce saving to avoid excessive writes
    clearTimeout(timer);

    // Reference properties to track changes
    void currentSession.chatHistory;
    void currentSession.documentContent;
    void currentSession.inputValue;

    if (activeSessionId) {
      timer = setTimeout(() => {
        // Trigger Svelte reactivity
        updateSession(activeSessionId, currentSession);
      }, 1000);
    } else if (currentSession.chatHistory.length > 0) {
      // If in a new session and there's content, create a new session
      createSession(currentSession);
    } else {
      timer = undefined;
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
        <Popover.Root>
          <Popover.Trigger>
            <Button variant="outline" size="icon" disabled={!activeSessionId}>
              <TrashIcon class="h-4 w-4" />
            </Button>
          </Popover.Trigger>
          <Popover.Content
            class="w-[280px] shadow-sm"
            sideOffset={10}
            align="end"
          >
            <p class="mb-4 text-sm text-gray-700">
              Are you sure you want to delete this session? This action cannot
              be undone.
            </p>
            <div class="flex justify-end gap-2">
              <Popover.Close>
                <Button variant="outline" size="sm">Cancel</Button>
              </Popover.Close>
              <Popover.Close>
                <Button
                  variant="destructive"
                  size="sm"
                  onclick={handleDeleteSession}
                >
                  Delete
                </Button>
              </Popover.Close>
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  </div>

  <TutoringView
    bind:documentContent={currentSession.documentContent}
    bind:chatHistory={currentSession.chatHistory}
    bind:inputValue={currentSession.inputValue}
  />
</div>
