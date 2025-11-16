<script lang="ts">
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import type { TutorMessage } from "$lib/tools";
  import ChatPanel from "../chat/ChatPanel.svelte";

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
  let chatPanel: ChatPanel;

  // Handle sending messages
  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !isGenerating) {
      chatPanel?.submitMessage(trimmed);
      inputValue = "";
    }
  };

  // Handle Enter key for sending messages
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle "Ask Tutor" from DocumentEditor
  const handleAskTutor = (selectedText: string, question: string) => {
    const formattedMessage = `Regarding: "${selectedText}"\n\nQuestion: ${question}`;
    chatPanel?.submitMessage(formattedMessage);
  };
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
        {inputValue}
        {isGenerating}
      />

      <div class="flex gap-3 border-t px-12 pt-6 pb-12">
        <Textarea
          bind:value={inputValue}
          onkeydown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={isGenerating}
        />
        <Button
          onclick={handleSend}
          disabled={isGenerating || !inputValue.trim()}
        >
          Ask
        </Button>
      </div>
    </div>
  </div>
</div>
