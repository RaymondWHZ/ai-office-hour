<script lang="ts">
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";
  import type { TutorMessage } from "$lib/tools";
  import ChatPanel from "../chat/ChatPanel.svelte";
  import ChatInput from "../chat/ChatInput.svelte";
  import { responseState } from "$lib/components/sections/document/extensions";

  interface Props {
    documentContent: string;
    messages?: TutorMessage[];
    inputValue?: string;
    isGenerating?: boolean;
  }

  let {
    documentContent = $bindable(""),
    messages = $bindable([]),
    inputValue = $bindable(""),
    isGenerating = $bindable(false),
  }: Props = $props();

  // Reference to ChatPanel component
  let chatPanel = $state() as ChatPanel;

  // Handle "Ask Tutor" from DocumentEditor
  const handleAskTutor = (selectedText: string, question: string) => {
    const formattedMessage = `Regarding: "${selectedText}"\n\nQuestion: ${question}`;
    chatPanel?.submitMessage(formattedMessage);
  };

  // Keep document context in sync for response block reviews
  $effect(() => {
    responseState.documentContext = documentContent;
  });
</script>

<div class="mx-auto w-full flex-1 overflow-hidden">
  <div class="flex h-full overflow-hidden">
    <div
      class="flex flex-1 flex-col items-center overflow-hidden p-6 md:col-span-3"
    >
      <Card class="h-full w-full max-w-7xl overflow-hidden p-0">
        <DocumentEditor
          bind:value={documentContent}
          onAskTutor={handleAskTutor}
        />
      </Card>
    </div>

    <div class="flex w-lg flex-col overflow-hidden border-l xl:w-xl 2xl:w-3xl">
      <ChatPanel
        bind:this={chatPanel}
        bind:documentContent
        bind:messages
        bind:isGenerating
      />
      <ChatInput
        bind:value={inputValue}
        disabled={isGenerating}
        onSubmit={chatPanel.submitMessage}
      />
    </div>
  </div>
</div>
