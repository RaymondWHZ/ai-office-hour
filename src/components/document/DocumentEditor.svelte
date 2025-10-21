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

  let { value = $bindable("") }: Props = $props();

  // References for DOM elements to use
  let bubbleMenu = $state<HTMLElement>();
  let element = $state<HTMLElement>();

  // State to hold the editor instance
  let editorState = $state<{ editor: Editor | null }>({ editor: null });

  // Initialize the editor on component mount
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
        // Migrate $$ math strings to math nodes
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

  // Sync external value changes to the editor content
  $effect(() => {
    if (editorState.editor && value !== editorState.editor.getHTML()) {
      editorState.editor.commands.setContent(value);
    }
  });

  // Clean up the editor instance on component destroy
  onDestroy(() => {
    editorState.editor?.destroy();
  });
</script>

<div class="relative h-full p-6">
  {#if editorState.editor}
    <div class="mb-12">
      {#snippet nodeButton(
        title: string,
        name: string,
        attributes?: Record<string, any>,
      )}
        <button
          class={`rounded px-1.5 ${editorState.editor?.isActive(name, attributes) ? "bg-black text-white" : "hover:bg-gray-200"}`}
          onclick={() =>
            editorState.editor
              ?.chain()
              .focus()
              .toggleNode(name, "paragraph", attributes)
              .run()}
        >
          {title}
        </button>
      {/snippet}

      {@render nodeButton("H1", "heading", { level: 1 })}
      {@render nodeButton("H2", "heading", { level: 2 })}
      {@render nodeButton("H3", "heading", { level: 3 })}
    </div>
  {/if}

  <div
    class="transition-visibility invisible absolute flex rounded bg-black p-1 transition-opacity"
    bind:this={bubbleMenu}
  >
    {#if editorState.editor}
      {#snippet markButton(
        title: string,
        name: string,
        attributes?: Record<string, any>,
      )}
        <button
          class={`m-0 px-1 font-medium text-white opacity-60 ${editorState.editor?.isActive(name, attributes) ? "opacity-100" : "hover:opacity-100"}`}
          onclick={() =>
            editorState.editor
              ?.chain()
              .focus()
              .toggleMark(name, attributes)
              .run()}
          class:active={editorState.editor?.isActive(name, attributes)}
        >
          {title}
        </button>
      {/snippet}

      {@render markButton("Bold", "bold")}
      {@render markButton("Italic", "italic")}
      {@render markButton("Strike", "strike")}
      {@render markButton("Code", "code")}
      {@render markButton("Highlight", "highlight")}
    {/if}
  </div>

  <div class="h-full" bind:this={element}></div>
</div>
