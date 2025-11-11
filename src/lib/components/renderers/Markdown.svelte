<script lang="ts">
  import { marked } from "marked";
  import markedKatex from "marked-katex-extension";

  interface Props {
    class?: string;
    value?: string;
  }

  let { class: className = "", value = "" }: Props = $props();

  marked.use({
    silent: true,
  });
  marked.use(
    markedKatex({
      throwOnError: false,
    }),
  );
</script>

<div class={className}>
  {@html marked(value)}
</div>
