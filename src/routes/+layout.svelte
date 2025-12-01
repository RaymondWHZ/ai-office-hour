<script lang="ts">
  import "katex/dist/katex.min.css";
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { Toaster } from "$lib/components/ui/sonner";
  import { onMount } from "svelte";
  import { loadFromStorage } from "$lib/stores/sessionStore.svelte.ts";
  import { loadModelFromStorage } from "$lib/stores/modelStore.svelte";

  let { children } = $props();

  let loading = $state(true);

  onMount(() => {
    loadFromStorage();
    loadModelFromStorage();
    loading = false;
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Toaster />

{#if !loading}
  {@render children()}
{/if}
