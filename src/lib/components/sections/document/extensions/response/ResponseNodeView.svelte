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

  const isSuccess = $derived(status === "success");
  const isError = $derived(status === "error");
  const isLoading = $derived(status === "loading");
  const isLocked = $derived(isSuccess || isLoading);

  // Determine card styling based on status
  const cardClass = () => {
    if (isSuccess) return "border-green-500 bg-green-50";
    if (isError) return "border-red-400 bg-red-50";
    if (isLoading) return "border-gray-400 bg-gray-50";
    return "border-blue-400 bg-blue-50";
  };

  // Determine content area styling based on status
  const contentClass = () => {
    if (isSuccess) return "border-green-200 bg-green-50";
    if (isError) return "border-red-200 bg-white";
    if (isLoading) return "border-gray-200 bg-gray-100";
    return "border-gray-200 bg-white";
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

<NodeViewWrapper class="my-4">
  <Card class="w-full {cardClass()}">
    <CardHeader class="flex flex-row items-start justify-between gap-2 pb-2">
      <div class="flex flex-1 items-start gap-2">
        {#if isSuccess}
          <CircleCheck class="mt-0.5 size-5 shrink-0 text-green-600" />
        {:else if isError}
          <CircleX class="mt-0.5 size-5 shrink-0 text-red-500" />
        {:else if isLoading}
          <LoaderCircle
            class="mt-0.5 size-5 shrink-0 animate-spin text-gray-500"
          />
        {/if}
        <div class="flex-1">
          {#if question}
            <div class="text-base font-semibold text-gray-800">
              {question}
            </div>
          {/if}
          {#if isSuccess}
            <div class="text-sm text-green-700">Correct!</div>
          {:else if isError}
            <div class="text-sm text-red-600">Try again</div>
          {:else if isLoading}
            <div class="text-sm text-gray-500">Reviewing...</div>
          {/if}
        </div>
      </div>
      <button
        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        onclick={handleDelete}
        title="Remove this response block"
      >
        <X class="size-4" />
      </button>
    </CardHeader>

    <CardContent class="pt-0">
      {#if hint}
        <div
          class="mb-3 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800"
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
