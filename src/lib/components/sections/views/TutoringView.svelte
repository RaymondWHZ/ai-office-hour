<script lang="ts">
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";
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
</script>

<div class="mx-auto w-full flex-1 overflow-hidden">
  <div class="flex h-full overflow-hidden">
    <div
      class="flex flex-1 flex-col items-center overflow-hidden p-6 md:col-span-3"
    >
      <Card class="h-full w-full max-w-7xl overflow-hidden p-0">
        <DocumentEditor bind:value={documentContent} />
      </Card>
    </div>

    <div class="flex w-lg flex-col overflow-hidden border-l xl:w-xl 2xl:w-3xl">
      <ChatPanel
        bind:documentContent
        bind:messages
        bind:inputValue
        bind:isGenerating
      />
    </div>
  </div>
</div>
