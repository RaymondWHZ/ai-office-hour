<script lang="ts">
  import * as Command from "$lib/components/ui/command";
  import {
    formatSessionName,
    sessionState,
    switchSession,
  } from "$lib/stores/sessionStore.svelte";
  import { FileIcon, Lightbulb, Upload } from "@lucide/svelte";

  interface Props {
    onUploadFile?: (file: File) => void;
    onStartEmpty?: () => void;
    onStartExample?: () => void;
  }

  let { onUploadFile, onStartEmpty, onStartExample }: Props = $props();

  let files = $state<FileList>();
  $effect(() => {
    const file = files?.[0];
    if (file) {
      onUploadFile?.(file);
    }
  });
</script>

<div class="flex flex-1 flex-col items-center">
  <Command.Root class="mt-[10vh] h-fit w-lg rounded-lg border shadow-lg">
    <Command.Input placeholder="Search for an option..." autofocus />
    <Command.List>
      <Command.Empty>No results found.</Command.Empty>
      <Command.Group heading="New Session">
        <Command.Item class="p-0">
          <label class="flex w-full items-center gap-2 px-2 py-1.5">
            <input class="hidden" type="file" accept="pdf/*" bind:files />
            <Upload /> Upload PDF File
          </label>
        </Command.Item>
        <Command.Item onclick={onStartEmpty}>
          <FileIcon /> Start with empty document
        </Command.Item>
        <Command.Item onclick={onStartExample}>
          <Lightbulb /> Use an example
        </Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Previous Sessions">
        {#each sessionState.sessions as session}
          <Command.Item onclick={() => switchSession(session.id)}>
            {formatSessionName(session)}
          </Command.Item>
        {/each}
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
