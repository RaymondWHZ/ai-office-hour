<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Editor } from "@tiptap/core";
  import { StarterKit } from "@tiptap/starter-kit";
  import Highlight from "@tiptap/extension-highlight";
  import BubbleMenu from "@tiptap/extension-bubble-menu";
  import CommentNode from "./Comment";
  import LatexNode from "./Latex";
  import { commentState, latexState } from "./document.svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Popover from "$lib/components/ui/popover";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Check } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import Markdown from "$lib/components/renderers/Markdown.svelte";

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

  // Comment tooltip state
  const getCommentOpen = () => !!commentState.dom;
  const setCommentOpen = (open: boolean) => {
    if (!open) {
      commentState.dom = undefined;
    }
  };

  // Latex tooltip state
  const getLatexOpen = () => !!latexState.dom;
  const setLatexOpen = (open: boolean) => {
    if (!open) {
      latexState.dom = undefined;
      setTimeout(() => latexState.update(latexState.latex), 10);
    }
  };
</script>

<Tooltip.Provider>
  <Tooltip.Root bind:open={getCommentOpen, setCommentOpen}>
    <Tooltip.Content
      class="shadow-sm"
      customAnchor={commentState.dom}
      sideOffset={8}
    >
      <Markdown value={commentState.comment} />
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>

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

<div class="relative flex h-full flex-col overflow-auto">
  <!-- Block menu -->
  {#if editorState.editor}
    <div
      class="sticky top-0 z-10 bg-linear-to-b from-white via-white via-80% to-transparent p-6 pb-12"
    >
      {#snippet nodeButton(
        title: string,
        name: string,
        attributes?: Record<string, any>,
      )}
        <button
          class={`px-1.5 ${editorState.editor?.isActive(name, attributes) ? "bg-accent" : "hover:bg-accent"}`}
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

  <!-- Bubble menu -->
  <div
    class="transition-visibility invisible absolute z-20 flex border bg-white p-1 text-sm shadow-sm transition-opacity"
    bind:this={bubbleMenu}
  >
    {#if editorState.editor}
      {#snippet markButton(
        title: HTMLElement | string,
        classNames: string,
        name: string,
        attributes?: Record<string, any>,
      )}
        <button
          class={cn(
            "px-2 font-medium",
            classNames,
            editorState.editor?.isActive(name, attributes)
              ? "bg-accent"
              : "hover:bg-accent",
          )}
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

      {@render markButton("Bold", "font-bold", "bold")}
      {@render markButton("Italic", "italic", "italic")}
      {@render markButton("Strike", "line-through", "strike")}
      {@render markButton("`Code`", "font-mono pt-1", "code")}
    {/if}
  </div>

  <!-- Actual document -->
  <div class="flex-1 px-6" bind:this={element}></div>
</div>
