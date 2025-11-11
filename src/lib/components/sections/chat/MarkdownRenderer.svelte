<script lang="ts">
  import { marked } from "marked";
  import markedKatex from "marked-katex-extension";

  interface Props {
    value: string;
  }

  let { value = "" }: Props = $props();

  marked.use({
    silent: true,
  });
  marked.use(
    markedKatex({
      throwOnError: false,
    }),
  );
</script>

<div class="prose max-w-none">
  {@html marked(value)}
</div>
