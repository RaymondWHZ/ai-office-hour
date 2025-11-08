<script lang="ts">
  import { Carta, Markdown } from "carta-md";
  import { math } from "@cartamd/plugin-math";
  import { code } from "@cartamd/plugin-code";
  import "carta-md/default.css";

  interface Props {
    value: string;
  }

  let { value = "" }: Props = $props();

  let carta = new Carta({
    extensions: [math(), code()],
    sanitizer: (s) => s,
  });
</script>

<div class="flex h-full flex-col items-stretch justify-stretch">
  {#if carta}
    <Markdown {carta} {value} />
  {/if}
</div>
