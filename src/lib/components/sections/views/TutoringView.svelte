<script lang="ts">
  import DocumentEditor from "$lib/components/sections/document/DocumentEditor.svelte";
  import { Card } from "$lib/components/ui/card";
  import type { TutorMessage } from "$lib/tools";
  import ChatPanel from "../chat/ChatPanel.svelte";

  interface Props {
    documentContent: string;
    messages?: TutorMessage[];
    inputValue?: string;
  }

  let {
    documentContent = $bindable(""),
    messages = $bindable([]),
    inputValue = $bindable(""),
  }: Props = $props();
</script>

<div class="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
  <div class="flex flex-col overflow-hidden border-r">
    <div class="border-b px-8 py-6">
      <h2
        class="m-0 text-base font-semibold tracking-wide text-gray-700 uppercase"
      >
        Document
      </h2>
    </div>
    <div class="flex-1 overflow-hidden p-6">
      <Card class="h-full overflow-hidden p-0">
        <DocumentEditor bind:value={documentContent} />
      </Card>
    </div>
  </div>

  <div class="flex flex-col overflow-hidden">
    <div class="border-b px-8 py-6">
      <h2
        class="m-0 text-base font-semibold tracking-wide text-gray-700 uppercase"
      >
        Chat
      </h2>
    </div>
    <div class="flex h-full flex-col overflow-hidden">
      <ChatPanel bind:documentContent bind:messages bind:inputValue />
    </div>
  </div>
</div>
