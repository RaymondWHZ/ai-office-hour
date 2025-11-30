<script lang="ts">
  import { onDestroy, onMount, type Component } from "svelte";
  import { StarterKit } from "@tiptap/starter-kit";
  import AskTutorPopup from "./AskTutorPopup.svelte";
  import {
    Code,
    List,
    ListOrdered,
    MessageSquareHeart,
    SeparatorHorizontal,
    TextQuote,
  } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import type { Readable } from "svelte/store";
  import {
    createEditor,
    Editor,
    EditorContent,
    BubbleMenu,
  } from "svelte-tiptap";
  import {
    CardNode,
    CommentNode,
    CommentPopup,
    LatexNode,
    LatexPopup,
  } from "./extensions";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { FONT_OPTIONS, getFontStyle } from "$lib/constants/fonts";

  let selectedFont = $state("");

  const currentFontOption = $derived(
    FONT_OPTIONS.find((f) => f.value === selectedFont) ?? FONT_OPTIONS[0],
  );

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
      extensions: [StarterKit, CommentNode, LatexNode, CardNode],
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

  // Ask Tutor popup state
  let askTutorPopup = $state() as AskTutorPopup;
  let askTutorButton = $state() as HTMLButtonElement;

  const handleAskTutorClick = () => {
    const { from, to } = $editor.state.selection;
    const selectedText = $editor.state.doc.textBetween(from, to);
    askTutorPopup.open(askTutorButton, selectedText);
  };
</script>

<svelte:head>
  {#if currentFontOption.stylesheet}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin="anonymous"
    />
    <link href={currentFontOption.stylesheet} rel="stylesheet" />
  {/if}
</svelte:head>

<CommentPopup />
<LatexPopup />

<AskTutorPopup bind:this={askTutorPopup} onSubmit={onAskTutor} />

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

      <span class="mx-1 text-gray-300">|</span>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <button
              class="px-1.5 hover:bg-accent"
              style={getFontStyle(currentFontOption.value)}
              {...props}
            >
              {currentFontOption.label}
            </button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.RadioGroup bind:value={selectedFont}>
            {#each FONT_OPTIONS as font}
              <DropdownMenu.RadioItem
                value={font.value}
                style={getFontStyle(font.value)}
                >{font.label}</DropdownMenu.RadioItem
              >
            {/each}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  {/if}

  <!-- Bubble menu -->
  {#if $editor}
    <BubbleMenu
      class="invisible absolute z-20 border bg-white p-1 shadow-sm"
      editor={$editor}
      shouldShow={({ editor, state }) =>
        !state.selection.empty && !editor.isActive("latex")}
    >
      <div class="flex text-sm">
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
          bind:this={askTutorButton}
          class="flex items-center gap-1 px-2 outline-none hover:bg-accent"
          onclick={handleAskTutorClick}
        >
          <MessageSquareHeart class="size-4" /> Ask Tutor
        </button>
      </div>
    </BubbleMenu>
  {/if}

  <!-- Actual document -->
  <div
    class="flex-1 px-32 pb-6"
    style={selectedFont ? `font-family: ${selectedFont}` : ""}
  >
    <EditorContent editor={$editor} />
  </div>
</div>
