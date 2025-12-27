<script lang="ts">
  import { NodeViewContent, NodeViewWrapper } from "svelte-tiptap";
  import { Card, CardHeader, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import {
    X,
    Send,
    CircleCheck,
    CircleX,
    Lightbulb,
    LoaderCircle,
    MessageCircleQuestion,
  } from "@lucide/svelte";
  import type { NodeViewProps } from "@tiptap/core";
  import { askHelpState } from "./askHelp.svelte";

  let { node, editor, updateAttributes, deleteNode }: NodeViewProps = $props();

  const question = $derived(node.attrs.question || "");
  const hint = $derived(node.attrs.hint || "");
  const status = $derived(node.attrs.status || "");
  const hideQuestion = $derived(node.attrs.hideQuestion || false);

  const isSuccess = $derived(status === "success");
  const isError = $derived(status === "error");
  const isLoading = $derived(status === "loading");
  const isLocked = $derived(isSuccess || isLoading);

  // Determine card styling based on status
  const cardClass = () => {
    if (isSuccess) return "border-success bg-success/10";
    if (isError) return "border-destructive bg-destructive/10";
    if (isLoading) return "border-muted-foreground bg-muted";
    return "border-info bg-info/10";
  };

  // Determine content area styling based on status
  const contentClass = () => {
    if (isSuccess) return "border-success/50 bg-success/10";
    if (isError) return "border-destructive/50 bg-background";
    if (isLoading) return "border-border bg-muted";
    return "border-border bg-background";
  };

  const handleSubmit = async () => {
    const answerText = node.textContent || "";

    if (!answerText.trim()) {
      return;
    }

    updateAttributes({ status: "loading" });

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer: answerText,
          documentContext: editor.getHTML(),
        }),
      });

      const result = await response.json();

      updateAttributes({
        status: result.status,
        hint: result.hint || "",
      });
    } catch {
      updateAttributes({
        status: "error",
        hint: "Failed to review your answer. Please try again.",
      });
    }
  };

  const handleDelete = () => {
    deleteNode();
  };

  const handleAskHelp = () => {
    askHelpState.pending = {
      question,
      currentAnswer: node.textContent || "",
    };
  };
</script>

<NodeViewWrapper>
  <Card class="relative w-full gap-2 p-2 {cardClass()}">
    <button
      class="absolute top-1 right-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      onclick={handleDelete}
      title="Remove this response block"
    >
      <X class="size-4" />
    </button>

    <CardHeader class="mt-3 flex flex-row items-start justify-between gap-2">
      <div class="flex flex-1 items-start gap-2">
        {#if isSuccess}
          <CircleCheck class="mt-0.5 size-5 shrink-0 text-success" />
        {:else if isError}
          <CircleX class="mt-0.5 size-5 shrink-0 text-destructive" />
        {:else if isLoading}
          <LoaderCircle
            class="mt-0.5 size-5 shrink-0 animate-spin text-muted-foreground"
          />
        {/if}
        <div class="flex-1">
          {#if question && !hideQuestion}
            <div class="text-base font-semibold">
              {question}
            </div>
          {/if}
          {#if isSuccess}
            <div class="text-sm text-success">Correct!</div>
          {:else if isError}
            <div class="text-sm text-destructive">Try again</div>
          {:else if isLoading}
            <div class="text-sm text-muted-foreground">Reviewing...</div>
          {/if}
        </div>
      </div>
    </CardHeader>

    <CardContent class="pt-0">
      {#if hint}
        <div
          class="mb-3 flex items-start gap-2 rounded border border-warning bg-warning/10 p-2 text-sm text-warning-foreground"
        >
          <Lightbulb class="mt-0.5 size-4 shrink-0" />
          <span>{hint}</span>
        </div>
      {/if}

      <div class="min-h-[60px] rounded border p-3 {contentClass()}">
        <NodeViewContent contenteditable={!isLocked} />
      </div>

      {#if !isLocked}
        <div class="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onclick={handleAskHelp}>
            <MessageCircleQuestion class="mr-1 size-4" />
            Ask for Help
          </Button>
          <Button
            variant={isError ? "secondary" : "default"}
            size="sm"
            onclick={handleSubmit}
          >
            {#if isError}
              <Send class="mr-1 size-4" />
              Resubmit
            {:else}
              <Send class="mr-1 size-4" />
              Submit for Review
            {/if}
          </Button>
        </div>
      {/if}
    </CardContent>
  </Card>
</NodeViewWrapper>
