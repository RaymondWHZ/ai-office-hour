<script lang="ts">
  import { latexState } from "./latex.svelte";
  import * as Popover from "$lib/components/ui/popover";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Check } from "@lucide/svelte";

  // Latex tooltip state
  const getLatexOpen = () => !!latexState.dom;
  const setLatexOpen = (open: boolean) => {
    if (!open) {
      latexState.dom = undefined;
      setTimeout(() => latexState.update(latexState.latex), 10);
    }
  };
</script>

<Popover.Root bind:open={getLatexOpen, setLatexOpen}>
  <Popover.Content
    class="w-[400px] p-2 shadow-sm"
    customAnchor={latexState.dom}
    sideOffset={8}
    align="start"
    alignOffset={-16}
  >
    <form class="flex gap-2" onsubmit={() => setLatexOpen(false)}>
      <Input bind:value={latexState.latex} placeholder="LaTeX" />
      <Button type="submit"><Check /></Button>
    </form>
  </Popover.Content>
</Popover.Root>
