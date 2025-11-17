<script lang="ts">
  import { NodeViewContent, NodeViewWrapper } from "svelte-tiptap";
  import { Card } from "$lib/components/ui/card";

  let {} = $props();
</script>

<NodeViewWrapper>
  <Card class="w-fit px-4 py-0">
    <NodeViewContent />
  </Card>
</NodeViewWrapper>
