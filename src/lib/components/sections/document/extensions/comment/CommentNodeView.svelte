<script lang="ts">
  import { NodeViewContent, NodeViewWrapper } from "svelte-tiptap";
  import * as Tooltip from "$lib/components/ui/tooltip";
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
  <Tooltip.Provider delayDuration={100}>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <span {...props} class="bg-accent">
            <NodeViewContent as="span" />
          </span>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content class="max-w-xs p-4 text-base shadow-sm" sideOffset={4}>
        <div class="flex items-start gap-2">
          <div class="flex-1">
            {#if title}
              <div class="mb-1 text-lg font-semibold">{title}</div>
            {/if}
            <Markdown value={comment} />
          </div>
          <button
            class="mt-0.5 shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            onclick={handleDismiss}
            title="Remove comment"
          >
            <X class="size-4" />
          </button>
        </div>
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
</NodeViewWrapper>
