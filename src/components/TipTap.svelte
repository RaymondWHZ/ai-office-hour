<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import { StarterKit } from "@tiptap/starter-kit";

  interface Props {
    content?: string;
  }

  let { content = "" }: Props = $props();

  let bubbleMenu = $state();
  let editor = $state<Editor>();
  let element = $state<HTMLElement>();
  let editorState = $state<{ editor: Editor | null }>({ editor: null });

  onMount(() => {
    editor = new Editor({
      element: element,
      extensions: [StarterKit],
      content,
      onTransaction: ({ editor }) => {
        // force re-render so `editor.isActive` works as expected
        editorState = { editor };
      },
    });
  });
  onDestroy(() => {
    editor?.destroy();
  });
</script>

<div style="position: relative" class="app">
  {#if editorState.editor}
    <div class="fixed-menu">
      <button
        onclick={() =>
          editorState.editor!.chain().focus().toggleHeading({ level: 1 }).run()}
        class:active={editorState.editor.isActive("heading", { level: 1 })}
      >
        H1
      </button>
      <button
        onclick={() =>
          editorState.editor!.chain().focus().toggleHeading({ level: 2 }).run()}
        class:active={editorState.editor.isActive("heading", { level: 2 })}
      >
        H2
      </button>
      <button
        onclick={() => editorState.editor!.chain().focus().setParagraph().run()}
        class:active={editorState.editor.isActive("paragraph")}
      >
        P
      </button>
    </div>
  {/if}

  <div class="prose focus:outline-none" bind:this={element}></div>
</div>

<style>
  button.active {
    background: black;
    color: white;
  }
</style>
