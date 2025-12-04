<script lang="ts">
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";
  import type { TutorMessage } from "$lib/tools";
  import ChatPanel from "../chat/ChatPanel.svelte";
  import ChatInput from "../chat/ChatInput.svelte";
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { askHelpState } from "$lib/components/sections/document/extensions";

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

  // Track if we should show the bottom input
  let showBottomInput = $state(true);

  // Reference to ChatPanel component
  let chatPanel = $state() as ChatPanel;

  // Handle "Ask Tutor" from DocumentEditor
  const handleAskTutor = (selectedText: string, question: string) => {
    const formattedMessage = `Regarding: "${selectedText}"\n\nQuestion: ${question}`;
    chatPanel?.submitMessage(formattedMessage);
  };

  // Handle "Ask for Help" from response blocks
  $effect(() => {
    const pending = askHelpState.pending;
    if (pending) {
      let message = `[Help Request]\n\nQuestion: ${pending.question}`;
      if (pending.currentAnswer.trim()) {
        message += `\n\nMy current answer: ${pending.currentAnswer}`;
      }
      message += `\n\nCan you give me a hint?`;
      chatPanel?.submitMessage(message);
      askHelpState.pending = undefined;
    }
  });
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
          bind:showBottomInput
          bind:inputValue
        />
        {#if showBottomInput}
          <ChatInput
            bind:value={inputValue}
            disabled={isGenerating}
            onSubmit={chatPanel.submitMessage}
          />
        {/if}
      </div>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
