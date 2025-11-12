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
  import { extractText, getDocumentProxy } from "unpdf";
  import Loader from "$lib/components/ui/loader/loader.svelte";

  const createSessionDate = (documentContent: string = "") => ({
    documentContent,
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

  let uploading = $state(false);

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
      currentSession = createSessionDate(data);
    } finally {
      uploading = false;
    }
  };
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
      <SessionSwitcher
        onClickNew={() => (currentSession = undefined)}
        onDelete={() => (currentSession = undefined)}
      />
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
      bind:chatHistory={currentSession.chatHistory}
      bind:inputValue={currentSession.inputValue}
    />
  {:else}
    <WelcomeView
      onUploadFile={handleUploadFile}
      onStartEmpty={() => (currentSession = createSessionDate())}
      onStartExample={() =>
        (currentSession = createSessionDate(SAMPLE_CONTENT))}
    />
  {/if}
</div>
