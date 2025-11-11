<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import { StarterKit } from "@tiptap/starter-kit";
  import Highlight from "@tiptap/extension-highlight";
  import BubbleMenu from "@tiptap/extension-bubble-menu";
  import CommentNode from "./Comment";
  import LatexNode from "./Latex";
  import { commentState } from "./comment.svelte";
  import { latexState } from "./latex.svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Popover from "$lib/components/ui/popover";

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
        CommentNode,
        LatexNode,
        BubbleMenu.configure({
          element: bubbleMenu,
          shouldShow: ({ editor, state }) =>
            !state.selection.empty && !editor.isActive("latex"),
        }),
      ],
      editorProps: {
        attributes: {
          class: "prose focus:outline-none max-w-full h-full",
        },
      },
      content: value,
      onTransaction: ({ editor }) => {
        // Increment the state signal to force a re-render
        value = editor.getHTML();
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

  const getCommentOpen = () => !!commentState.dom;
  const setCommentOpen = (open: boolean) => {
    if (!open) {
      commentState.dom = undefined;
    }
  };

  const getLatexOpen = () => !!latexState.dom;
  const setLatexOpen = (open: boolean) => {
    if (!open) {
      latexState.dom = undefined;
    }
  };
</script>

<Tooltip.Provider>
  <Tooltip.Root bind:open={getCommentOpen, setCommentOpen}>
    <Tooltip.Content customAnchor={commentState.dom}>
      {commentState.comment}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>

<Popover.Root bind:open={getLatexOpen, setLatexOpen}>
  <Popover.Content customAnchor={latexState.dom}>
    {latexState.latex}
  </Popover.Content>
</Popover.Root>

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
