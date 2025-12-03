<script lang="ts">
  import { NodeViewContent, NodeViewWrapper } from "svelte-tiptap";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import type { NodeViewProps } from "@tiptap/core";

  let { node }: NodeViewProps = $props();

  const title = $derived(node.attrs.title as string | undefined);
  const comment = $derived(node.attrs.comment as string);
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
        {#if title}
          <div class="mb-1 text-lg font-semibold">{title}</div>
        {/if}
        <Markdown value={comment} />
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
</NodeViewWrapper>
