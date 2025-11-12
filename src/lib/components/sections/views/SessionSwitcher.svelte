<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import * as Popover from "$lib/components/ui/popover";
  import {
    sessionState,
    getActiveSession,
    formatSessionName,
    switchSession,
    deleteSession,
  } from "$lib/stores/sessionStore.svelte";
  import { PlusIcon, TrashIcon } from "@lucide/svelte";

  // Derived values
  const sessions = $derived(sessionState.sessions);
  const activeSessionId = $derived(sessionState.activeSessionId);
  const activeSession = $derived(getActiveSession());

  function handleSessionChange(data: string) {
    const sessionId = data === "" ? "" : data;
    switchSession(sessionId);
  }

  function handleNewSession() {
    // Enter virtual state
    switchSession(null);
  }

  function handleDeleteSession() {
    if (activeSessionId) {
      deleteSession(activeSessionId);
      switchSession(null);
    }
  }
</script>

<div class="flex items-center gap-2">
  <Select.Root
    type="single"
    value={activeSessionId ?? ""}
    onValueChange={handleSessionChange}
  >
    <Select.Trigger class="w-[280px]">
      {activeSession ? formatSessionName(activeSession) : "New Session"}
    </Select.Trigger>
    <Select.Content>
      <Select.Item value={""}>New Session</Select.Item>
      {#each sessions as session}
        <Select.Item value={session.id}
          >{formatSessionName(session)}</Select.Item
        >
      {/each}
    </Select.Content>
  </Select.Root>
  <Button onclick={handleNewSession} variant="outline" size="icon">
    <PlusIcon class="h-4 w-4" />
  </Button>
  <Popover.Root>
    <Popover.Trigger>
      <Button variant="outline" size="icon" disabled={!activeSessionId}>
        <TrashIcon class="h-4 w-4" />
      </Button>
    </Popover.Trigger>
    <Popover.Content class="w-[280px] shadow-sm" sideOffset={10} align="end">
      <p class="mb-4 text-sm text-gray-700">
        Are you sure you want to delete this session? This action cannot be
        undone.
      </p>
      <div class="flex justify-end gap-2">
        <Popover.Close>
          <Button variant="outline" size="sm">Cancel</Button>
        </Popover.Close>
        <Popover.Close>
          <Button variant="destructive" size="sm" onclick={handleDeleteSession}>
            Delete
          </Button>
        </Popover.Close>
      </div>
    </Popover.Content>
  </Popover.Root>
</div>
