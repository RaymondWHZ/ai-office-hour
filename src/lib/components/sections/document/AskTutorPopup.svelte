<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";

  interface Props {
    open?: boolean;
    selectedText?: string;
    anchor?: HTMLElement;
    onSubmit?: (selectedText: string, question: string) => void;
    onClose?: () => void;
  }

  let {
    open = $bindable(false),
    selectedText = "",
    anchor = undefined,
    onSubmit,
    onClose,
  }: Props = $props();

  let questionInput = $state("");

  const handleSubmit = () => {
    if (questionInput.trim() && selectedText) {
      onSubmit?.(selectedText, questionInput);
      questionInput = "";
    }
  };

  const handleClose = () => {
    onClose?.();
    questionInput = "";
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
</script>

<Popover.Root bind:open>
  <Popover.Content
    class="w-[400px] p-4 shadow-sm"
    customAnchor={anchor}
    sideOffset={8}
    align="start"
  >
    <div class="flex flex-col gap-3">
      <!-- Selected text preview -->
      <div
        class="border-l-2 border-gray-300 pl-2 text-xs text-gray-500 max-h-20 overflow-y-auto"
      >
        {selectedText.length > 100
          ? selectedText.slice(0, 100) + "..."
          : selectedText}
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
        <Button variant="outline" onclick={handleClose}> Cancel </Button>
        <Button onclick={handleSubmit} disabled={!questionInput.trim()}>
          Ask
        </Button>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
