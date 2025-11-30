<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";

  interface Props {
    onSubmit?: (selectedText: string, question: string) => void;
  }

  let { onSubmit }: Props = $props();

  let questionInput = $state("");
  let currentAnchor = $state<HTMLElement>();
  let currentSelectedText = $state("");

  export function open(anchor: HTMLElement, selectedText: string) {
    currentAnchor = anchor;
    currentSelectedText = selectedText;
  }

  const handleClose = () => {
    currentAnchor = undefined;
    setTimeout(() => {
      currentSelectedText = "";
      questionInput = "";
    }, 200);
  };

  const handleSubmit = () => {
    const trimmedQuestion = questionInput.trim();
    if (currentSelectedText && trimmedQuestion) {
      onSubmit?.(currentSelectedText, trimmedQuestion);
      handleClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
</script>

<Popover.Root bind:open={() => !!currentAnchor, (v) => !v && handleClose()}>
  <Popover.Content
    class="w-[400px] p-4 shadow-sm"
    customAnchor={currentAnchor}
    sideOffset={8}
    align="start"
  >
    <div class="flex flex-col gap-3">
      <!-- Selected text preview -->
      <div
        class="text-md max-h-20 overflow-y-auto border-l-2 border-gray-300 pl-2 text-gray-500"
      >
        {currentSelectedText.length > 100
          ? currentSelectedText.slice(0, 100) + "..."
          : currentSelectedText}
      </div>

      <!-- Question input -->
      <Textarea
        bind:value={questionInput}
        placeholder="Ask a question about this text..."
        rows={3}
        onkeydown={handleKeyDown}
      />

      <!-- Buttons -->
      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={handleClose}>Cancel</Button>
        <Button onclick={handleSubmit} disabled={!questionInput.trim()}>
          Ask
        </Button>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
