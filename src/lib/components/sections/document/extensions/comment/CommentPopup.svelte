<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import { commentState } from "./comment.svelte";

  // Comment tooltip state
  let lazyCommentAnchor = $state<HTMLElement | undefined>(undefined);
  const getCommentOpen = () => !!commentState.dom || !!lazyCommentAnchor;
</script>

<Tooltip.Provider>
  <Tooltip.Root bind:open={getCommentOpen, () => {}}>
    <Tooltip.Content
      class="shadow-sm"
      customAnchor={commentState.dom ?? lazyCommentAnchor}
      sideOffset={-1}
      onmouseenter={() => (lazyCommentAnchor = commentState.dom)}
      onmouseleave={() =>
        setTimeout(() => (lazyCommentAnchor = undefined), 100)}
    >
      <Markdown value={commentState.comment} />
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
