<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Popover from "$lib/components/ui/popover";
  import { PlusIcon, TrashIcon } from "@lucide/svelte";

  interface Props {
    onClickNew?: () => void;
    onDelete?: () => void;
  }

  let { onClickNew, onDelete }: Props = $props();
</script>

<div class="flex items-center gap-2">
  <Button onclick={onClickNew} variant="outline" size="icon">
    <PlusIcon class="h-4 w-4" />
  </Button>
  <Popover.Root>
    <Popover.Trigger>
      <Button variant="outline" size="icon">
        <TrashIcon class="h-4 w-4" />
      </Button>
    </Popover.Trigger>
    <Popover.Content class="w-[280px] shadow-sm" sideOffset={10} align="end">
      <p class="mb-4 text-sm text-gray-700">
        Are you sure you want to clear the current session? This action cannot
        be undone.
      </p>
      <div class="flex justify-end gap-2">
        <Popover.Close>
          <Button variant="outline" size="sm">Cancel</Button>
        </Popover.Close>
        <Popover.Close>
          <Button variant="destructive" size="sm" onclick={onDelete}>
            Clear
          </Button>
        </Popover.Close>
      </div>
    </Popover.Content>
  </Popover.Root>
</div>
