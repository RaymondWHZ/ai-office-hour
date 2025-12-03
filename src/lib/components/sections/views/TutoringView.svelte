<script lang="ts">
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";
  import type { TutorMessage } from "$lib/tools";
  import ChatPanel from "../chat/ChatPanel.svelte";
  import ChatInput from "../chat/ChatInput.svelte";
  import * as Resizable from "$lib/components/ui/resizable/index.js";

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
</script>

<div class="h-full w-full overflow-hidden">
  <Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={65} minSize={30}>
      <div class="flex h-full flex-col items-center overflow-hidden p-6">
        <Card class="h-full w-full max-w-7xl overflow-hidden p-0">
          <DocumentEditor
            bind:value={documentContent}
            onAskTutor={handleAskTutor}
          />
        </Card>
      </div>
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={35} minSize={20}>
      <div class="flex h-full flex-col overflow-hidden">
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
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
