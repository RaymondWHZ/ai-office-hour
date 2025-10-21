<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import { StarterKit } from "@tiptap/starter-kit";
  import Highlight from "@tiptap/extension-highlight";
  import Math, { migrateMathStrings } from "@tiptap/extension-mathematics";
  import BubbleMenu from "@tiptap/extension-bubble-menu";

  interface Props {
    value?: string;
  }

  let { value = $bindable() }: Props = $props();

  let bubbleMenu = $state<HTMLElement>();
  let element = $state<HTMLElement>();
  let editorState = $state<{ editor: Editor | null }>({ editor: null });

  onMount(() => {
    editorState.editor = new Editor({
      element: element,
      extensions: [
        StarterKit,
        Highlight,
        Math.configure({
          blockOptions: {
            onClick: (node, pos) => {
              const newCalculation = prompt(
                "Enter new calculation:",
                node.attrs.latex,
              );
              if (newCalculation) {
                editorState.editor
                  ?.chain()
                  .setNodeSelection(pos)
                  .updateBlockMath({ latex: newCalculation })
                  .focus()
                  .run();
              }
            },
          },
          inlineOptions: {
            onClick: (node, pos) => {
              const newCalculation = prompt(
                "Enter new calculation:",
                node.attrs.latex,
              );
              if (newCalculation) {
                editorState.editor
                  ?.chain()
                  .setNodeSelection(pos)
                  .updateInlineMath({ latex: newCalculation })
                  .focus()
                  .run();
              }
            },
          },
        }),
        BubbleMenu.configure({
          element: bubbleMenu,
        }),
      ],
      editorProps: {
        attributes: {
          class: "prose focus:outline-none max-w-full h-full",
        },
      },
      content: value,
      onCreate: ({ editor: currentEditor }) => {
        migrateMathStrings(currentEditor);
      },
      onTransaction: ({ editor }) => {
        // Update the bound value whenever the editor content changes
        value = editor.getHTML();

        // Increment the state signal to force a re-render
        editorState = { editor };
      },
    });
  });
  onDestroy(() => {
    editorState.editor?.destroy();
  });
</script>

<div class="relative max-h-full p-6">
  {#if editorState.editor}
    <div class="mb-12">
      <button
        class="rounded px-2 hover:bg-gray-200"
        onclick={() =>
          editorState.editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        class:active={editorState.editor.isActive("heading", { level: 1 })}
      >
        H1
      </button>
      <button
        class="rounded px-2 hover:bg-gray-200"
        onclick={() =>
          editorState.editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        class:active={editorState.editor.isActive("heading", { level: 2 })}
      >
        H2
      </button>
      <button
        class="rounded px-2 hover:bg-gray-200"
        onclick={() =>
          editorState.editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        class:active={editorState.editor.isActive("heading", { level: 3 })}
      >
        H3
      </button>
    </div>
  {/if}

  <div class="bubble-menu" bind:this={bubbleMenu}>
    {#if editorState.editor}
      <button
        onclick={() => editorState.editor?.chain().focus().toggleBold().run()}
        class:active={editorState.editor.isActive("bold")}
      >
        Bold
      </button>
      <button
        onclick={() => editorState.editor?.chain().focus().toggleItalic().run()}
        class:active={editorState.editor.isActive("italic")}
      >
        Italic
      </button>
      <button
        onclick={() => editorState.editor?.chain().focus().toggleStrike().run()}
        class:active={editorState.editor.isActive("strike")}
      >
        Strike
      </button>
      <button
        onclick={() => editorState.editor?.chain().focus().toggleCode().run()}
        class:active={editorState.editor.isActive("code")}
      >
        Code
      </button>
      <button
        onclick={() =>
          editorState.editor?.chain().focus().toggleHighlight().run()}
        class:active={editorState.editor.isActive("highlight")}
      >
        Highlight
      </button>
    {/if}
  </div>

  <div class="h-full" bind:this={element}></div>
</div>

<style lang="css">
  button.active {
    background: black;
    color: white;
  }

  .bubble-menu {
    visibility: hidden;
    position: absolute;
    display: flex;
    background-color: #0d0d0d;
    padding: 0.2rem;
    border-radius: 0.5rem;
    transition:
      visibility 0.1s ease,
      opacity 0.1s ease;
  }

  .bubble-menu button {
    border: none;
    background: none;
    color: #fff;
    font-weight: 500;
    padding: 0 0.2rem;
    opacity: 0.6;
    margin: 0;
  }

  .bubble-menu button:hover,
  .bubble-menu button.active {
    opacity: 1;
  }
</style>
