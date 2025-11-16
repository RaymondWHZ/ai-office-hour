<script lang="ts">
  import { onDestroy, onMount, type Component } from "svelte";
  import { StarterKit } from "@tiptap/starter-kit";
  import CommentNode from "./Comment";
  import LatexNode from "./Latex";
  import AskTutorPopup from "./AskTutorPopup.svelte";
  import { commentState, latexState } from "./document.svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Popover from "$lib/components/ui/popover";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import {
    Check,
    Code,
    List,
    ListOrdered,
    MessageSquareHeart,
    SeparatorHorizontal,
    TextQuote,
  } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import type { Readable } from "svelte/store";
  import {
    createEditor,
    Editor,
    EditorContent,
    BubbleMenu,
  } from "svelte-tiptap";

  interface Props {
    value?: string;
    onAskTutor?: (selectedText: string, question: string) => void;
  }

  let { value = $bindable(""), onAskTutor }: Props = $props();

  // State to hold the editor instance
  let editor = $state() as Readable<Editor>;

  // Initialize the editor on component mount
  onMount(() => {
    editor = createEditor({
      extensions: [StarterKit, CommentNode, LatexNode],
      editorProps: {
        attributes: {
          class: "prose focus:outline-none max-w-full h-full",
        },
      },
      content: value,
      onTransaction: ({ editor }) => {
        // Sync editor content to external value
        value = editor.getHTML();
      },
    });
  });

  // Sync external value changes to the editor content
  $effect(() => {
    if ($editor && value !== $editor.getHTML()) {
      $editor.commands.setContent(value);
    }
  });

  // Clean up the editor instance on component destroy
  onDestroy(() => {
    $editor?.destroy();
  });

  // Comment tooltip state
  let lazyAnchor = $state<HTMLElement | undefined>(undefined);
  const getCommentOpen = () => !!commentState.dom || !!lazyAnchor;

  // Latex tooltip state
  const getLatexOpen = () => !!latexState.dom;
  const setLatexOpen = (open: boolean) => {
    if (!open) {
      latexState.dom = undefined;
      setTimeout(() => latexState.update(latexState.latex), 10);
    }
  };

  // Ask Tutor popup state
  let askTutorOpen = $state(false);
  let askTutorAnchor = $state<HTMLElement | undefined>(undefined);
  let selectedText = $state("");

  const handleAskTutorClick = () => {
    if ($editor) {
      const { from, to } = $editor.state.selection;
      selectedText = $editor.state.doc.textBetween(from, to);

      // Get the coordinates for positioning
      const coords = $editor.view.coordsAtPos(from);
      const tempAnchor = document.createElement("div");
      tempAnchor.style.position = "absolute";
      tempAnchor.style.left = `${coords.left}px`;
      tempAnchor.style.top = `${coords.top}px`;
      document.body.appendChild(tempAnchor);
      askTutorAnchor = tempAnchor;

      askTutorOpen = true;
    }
  };

  const handleAskTutorSubmit = (text: string, question: string) => {
    onAskTutor?.(text, question);
    askTutorOpen = false;
    selectedText = "";

    // Clean up anchor
    if (askTutorAnchor) {
      document.body.removeChild(askTutorAnchor);
      askTutorAnchor = undefined;
    }
  };

  const handleAskTutorClose = () => {
    askTutorOpen = false;
    selectedText = "";

    // Clean up anchor
    if (askTutorAnchor) {
      document.body.removeChild(askTutorAnchor);
      askTutorAnchor = undefined;
    }
  };
</script>

<Tooltip.Provider>
  <Tooltip.Root bind:open={getCommentOpen, () => {}}>
    <Tooltip.Content
      class="shadow-sm"
      customAnchor={commentState.dom ?? lazyAnchor}
      sideOffset={-1}
      onmouseenter={() => (lazyAnchor = commentState.dom)}
      onmouseleave={() => setTimeout(() => (lazyAnchor = undefined), 100)}
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

<AskTutorPopup
  bind:open={askTutorOpen}
  {selectedText}
  anchor={askTutorAnchor}
  onSubmit={handleAskTutorSubmit}
  onClose={handleAskTutorClose}
/>

<div class="relative flex h-full flex-col overflow-auto">
  <!-- Block menu -->
  {#if $editor}
    <div
      class="sticky top-0 z-10 flex items-center gap-1 bg-linear-to-b from-white via-white via-80% to-transparent px-32 pt-8 pb-12"
    >
      {#snippet toolbarButton(
        Title: string | Component,
        isActive: boolean,
        onclick: () => void,
      )}
        <button
          class={`px-1.5 ${isActive ? "bg-accent" : "hover:bg-accent"}`}
          {onclick}
        >
          {#if typeof Title === "string"}
            {Title}
          {:else}
            <Title class="p-0.5" />
          {/if}
        </button>
      {/snippet}

      {#snippet nodeButton(
        title: string,
        name: string,
        attributes?: Record<string, any>,
      )}
        {@render toolbarButton(
          title,
          $editor?.isActive(name, attributes) ?? false,
          () =>
            $editor
              ?.chain()
              .focus()
              .toggleNode(name, "paragraph", attributes)
              .run(),
        )}
      {/snippet}

      {@render nodeButton("H1", "heading", { level: 1 })}
      {@render nodeButton("H2", "heading", { level: 2 })}
      {@render nodeButton("H3", "heading", { level: 3 })}

      <span class="mx-1 text-gray-300">|</span>

      {@render toolbarButton(
        List,
        $editor?.isActive("bulletList") ?? false,
        () => $editor?.chain().focus().toggleBulletList().run(),
      )}
      {@render toolbarButton(
        ListOrdered,
        $editor?.isActive("orderedList") ?? false,
        () => $editor?.chain().focus().toggleOrderedList().run(),
      )}

      <span class="mx-1 text-gray-300">|</span>

      {@render toolbarButton(
        TextQuote,
        $editor?.isActive("blockquote") ?? false,
        () => $editor?.chain().focus().toggleBlockquote().run(),
      )}
      {@render toolbarButton(
        Code,
        $editor?.isActive("codeBlock") ?? false,
        () => $editor?.chain().focus().toggleCodeBlock().run(),
      )}

      <span class="mx-1 text-gray-300">|</span>

      {@render toolbarButton(SeparatorHorizontal, false, () =>
        $editor?.chain().focus().setHorizontalRule().run(),
      )}
    </div>
  {/if}

  <!-- Bubble menu -->
  {#if $editor}
    <BubbleMenu
      class="transition-visibility invisible absolute z-20 flex border bg-white p-1 text-sm shadow-sm transition-opacity"
      editor={$editor}
      shouldShow={({ editor, state }) =>
        !state.selection.empty && !editor.isActive("latex")}
    >
      <div>
        {#snippet markButton(
          title: HTMLElement | string,
          classNames: string,
          name: string,
          attributes?: Record<string, any>,
        )}
          <button
            class={cn(
              "px-2",
              classNames,
              $editor?.isActive(name, attributes)
                ? "bg-accent"
                : "hover:bg-accent",
            )}
            onclick={() =>
              $editor?.chain().focus().toggleMark(name, attributes).run()}
            class:active={$editor?.isActive(name, attributes)}
          >
            {title}
          </button>
        {/snippet}

        {@render markButton("Bold", "font-bold", "bold")}
        {@render markButton("Italic", "italic", "italic")}
        {@render markButton("Strike", "line-through", "strike")}
        {@render markButton("`Code`", "font-mono pt-1", "code")}

        <span class="mx-1 text-gray-300">|</span>

        <button
          class="flex items-center gap-1 px-2 hover:bg-accent"
          onclick={handleAskTutorClick}
        >
          <MessageSquareHeart class="size-4" /> Ask Tutor
        </button>
      </div>
    </BubbleMenu>
  {/if}

  <!-- Actual document -->
  <EditorContent class="flex-1 px-32 pb-6" editor={$editor} />
</div>
