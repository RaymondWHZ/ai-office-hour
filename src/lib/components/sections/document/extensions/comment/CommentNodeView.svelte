<script lang="ts">
  import { NodeViewContent, NodeViewWrapper } from "svelte-tiptap";
  import * as HoverCard from "$lib/components/ui/hover-card";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { X } from "@lucide/svelte";
  import type { NodeViewProps } from "@tiptap/core";

  let { node, editor, getPos }: NodeViewProps = $props();

  const title = $derived(node.attrs.title as string | undefined);
  const comment = $derived(node.attrs.comment as string);

  const handleDismiss = () => {
    const pos = getPos();
    if (pos === undefined) return;

    // Get the text content of the comment node
    const textContent = node.textContent;

    // Delete the comment node and insert plain text in its place
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .insertContentAt(pos, textContent + " ")
      .run();
  };
</script>

<NodeViewWrapper as="span">
  <HoverCard.Root openDelay={100} closeDelay={100}>
    <HoverCard.Trigger>
      {#snippet child({ props })}
        <span {...props} class="bg-comment text-comment-foreground">
          <NodeViewContent as="span" />
        </span>
      {/snippet}
    </HoverCard.Trigger>
    <HoverCard.Content class="relative max-w-xs p-4 text-base" sideOffset={4}>
      <button
        class="absolute top-1 right-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        onclick={handleDismiss}
        title="Remove this comment"
      >
        <X class="size-4" />
      </button>
      {#if title}
        <div class="mb-1 text-lg font-semibold">{title}</div>
      {/if}
      <Markdown value={comment} />
    </HoverCard.Content>
  </HoverCard.Root>
</NodeViewWrapper>
