<script lang="ts">
  import * as Command from "$lib/components/ui/command";

  import {
    formatSessionName,
    sessionState,
    switchSession,
  } from "$lib/stores/sessionStore.svelte";
  import { File, Lightbulb, Upload } from "@lucide/svelte";
  import { toast } from "svelte-sonner";

  interface Props {
    onStartEmpty?: () => void;
    onStartExample?: () => void;
    onSessionChange?: (sessionId: string | null) => void;
  }

  let { onStartEmpty, onStartExample, onSessionChange }: Props = $props();
</script>

<div class="flex flex-1 flex-col items-center">
  <Command.Root class="mt-[10vh] h-fit w-lg rounded-lg border shadow-lg">
    <Command.Input placeholder="Search for an option..." autofocus />
    <Command.List>
      <Command.Empty>No results found.</Command.Empty>
      <Command.Group heading="New Session">
        <Command.Item onclick={() => toast.info("Upload feature coming soon!")}>
          <Upload /> Upload File
        </Command.Item>
        <Command.Item onclick={onStartEmpty}>
          <File /> Start with empty document
        </Command.Item>
        <Command.Item onclick={onStartExample}>
          <Lightbulb /> Use an example
        </Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Previous Sessions">
        {#each sessionState.sessions as session}
          <Command.Item
            onclick={() => {
              switchSession(session.id);
              onSessionChange?.(session.id);
            }}>{formatSessionName(session)}</Command.Item
          >
        {/each}
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
