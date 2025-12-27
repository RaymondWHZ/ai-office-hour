<script lang="ts">
  import { SAMPLE_CONTENT } from "$lib/constants/sampleContent";
  import TutoringView from "$lib/components/sections/views/TutoringView.svelte";
  import SessionSwitcher from "$lib/components/sections/views/SessionSwitcher.svelte";
  import WelcomeView from "$lib/components/sections/views/WelcomeView.svelte";
  import { extractText, getDocumentProxy } from "unpdf";
  import Loader from "$lib/components/ui/loader/loader.svelte";
  import { ModelSelector } from "$lib/components/ui/model-selector";
  import type { TutorMessage } from "$lib/tools";
  import {
    getActiveSession,
    sessionState,
    switchSession,
    upsertSession,
  } from "$lib/stores/sessionStore.svelte.ts";
  import { untrack } from "svelte";

  // In-memory session state (no persistence)
  type SessionData = {
    documentContent: string;
    messages: TutorMessage[];
    inputValue: string;
  };

  const createSessionData = (documentContent: string = ""): SessionData => ({
    documentContent,
    messages: [],
    inputValue: "",
  });

  let currentSession = $state<SessionData | undefined>();
  let uploading = $state(false);
  let isGenerating = $state(false);

  const handleUploadFile = async (file: File) => {
    uploading = true;

    try {
      // Either fetch a PDF file from the web or load it from the file system
      const buffer = await file.arrayBuffer();

      // Then, load the PDF file into a PDF.js document
      const pdf = await getDocumentProxy(new Uint8Array(buffer));

      // Finally, extract the text from the PDF file
      const { text } = await extractText(pdf, { mergePages: false });

      // Send the extracted text to the backend for formatting
      const response = await fetch("/api/format", {
        method: "POST",
        body: text.join(""),
      });

      // Extract the formatted text from the response
      const { data } = await response.json();

      // Create a new session with the extracted text
      currentSession = createSessionData(data);
    } finally {
      uploading = false;
    }
  };

  // Load from storage when active session changes
  $effect(() => {
    void sessionState.activeSessionId; // track changes
    currentSession = untrack(() => getActiveSession());
  });

  // Debounced save for documentContent (200ms)
  $effect(() => {
    if (!currentSession || isGenerating) return;

    void currentSession.documentContent; // track changes
    void currentSession.inputValue; // track changes

    const session = currentSession;
    const timer = setTimeout(() => {
      upsertSession(session);
    }, 500);

    return () => clearTimeout(timer);
  });
</script>

<div class="flex h-screen flex-col">
  <div class="border-b px-6 py-3">
    <div class="flex items-center justify-between gap-4">
      <button
        class="cursor-pointer text-left"
        onclick={() => switchSession(null)}
      >
        <h1 class="m-0 text-lg font-semibold">AI Office Hour</h1>
      </button>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
        <ModelSelector />
        <SessionSwitcher
          onClickNew={() => (currentSession = undefined)}
          onDelete={() => (currentSession = undefined)}
        />
      </div>
    </div>
  </div>

  {#if uploading}
    <div class="flex flex-1 flex-col items-center">
      <div class="mt-[15vh] flex items-center gap-2">
        <Loader /> Uploading and processing your document...
      </div>
    </div>
  {:else if currentSession}
    <TutoringView
      bind:documentContent={currentSession.documentContent}
      bind:messages={currentSession.messages}
      bind:inputValue={currentSession.inputValue}
      bind:isGenerating
    />
  {:else}
    <WelcomeView
      onUploadFile={handleUploadFile}
      onStartEmpty={() => (currentSession = createSessionData())}
      onStartExample={() =>
        (currentSession = createSessionData(SAMPLE_CONTENT))}
    />
  {/if}
</div>
