<script lang="ts">
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";

  interface Props {
    value?: string;
    disabled?: boolean;
    placeholder?: string;
    onSubmit?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    disabled = false,
    placeholder = "Ask a question...",
    onSubmit,
  }: Props = $props();

  const handleSubmit = () => {
    onSubmit?.(value);
    value = "";
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
</script>

<div class="flex gap-3 border-t px-12 pt-6 pb-12">
  <Textarea bind:value onkeydown={handleKeyDown} {placeholder} {disabled} />
  <Button onclick={handleSubmit} disabled={disabled || !value.trim()}>
    Ask
  </Button>
</div>
