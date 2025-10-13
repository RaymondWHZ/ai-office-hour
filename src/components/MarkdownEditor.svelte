<script lang="ts">
  import { onMount } from "svelte";
  import { Carta, MarkdownEditor as CartaEditor } from "carta-md";
  import { math } from "@cartamd/plugin-math";
  import { code } from "@cartamd/plugin-code";
  import "carta-md/default.css";

  interface Props {
    value: string;
    onchange?: (value: string) => void;
  }

  let { value = $bindable(""), onchange }: Props = $props();

  let carta = $state<Carta>();

  onMount(() => {
    carta = new Carta({
      extensions: [math(), code()],
      sanitizer: (s) => s,
    });
  });
</script>

<div class="flex flex-col items-stretch justify-stretch size-full">
  {#if carta}
    <CartaEditor
      theme="default"
      mode="tabs"
      {carta}
      bind:value
      placeholder="Paste or write your assignment here..."
    />
  {/if}
</div>
