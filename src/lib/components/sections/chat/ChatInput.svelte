<script lang="ts">
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";

  interface Props {
    value?: string;
    disabled?: boolean;
    placeholder?: string;
    onSubmit?: () => void;
  }

  let {
    value = $bindable(""),
    disabled = false,
    placeholder = "Ask a question...",
    onSubmit,
  }: Props = $props();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };
</script>

<div class="flex gap-3 border-t px-12 pt-6 pb-12">
  <Textarea
    bind:value
    onkeydown={handleKeyDown}
    {placeholder}
    {disabled}
  />
  <Button onclick={onSubmit} disabled={disabled || !value.trim()}>
    Ask
  </Button>
</div>
