<script lang="ts">
  import { NodeViewContent, NodeViewWrapper } from "svelte-tiptap";
  import { Card, CardHeader, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { X, Check, Send } from "@lucide/svelte";
  import { responseState } from "./response.svelte";
  import type { NodeViewProps } from "@tiptap/core";

  let { node, updateAttributes, deleteNode }: NodeViewProps = $props();

  const question = $derived(node.attrs.question || "");
  const submitted = $derived(node.attrs.submitted === "true");

  const handleSubmit = () => {
    const answerText = node.textContent || "";

    if (!answerText.trim()) {
      return;
    }

    responseState.pendingSubmission = {
      question: question || undefined,
      answer: answerText,
    };

    updateAttributes({ submitted: "true" });
  };

  const handleDelete = () => {
    deleteNode();
  };
</script>

<NodeViewWrapper class="my-4">
  <Card
    class="w-full {submitted
      ? 'border-green-400 bg-green-50'
      : 'border-blue-400 bg-blue-50'}"
  >
    <CardHeader class="flex flex-row items-start justify-between gap-2 pb-2">
      <div class="flex-1">
        {#if question}
          <div class="text-base font-semibold text-gray-800">
            {question}
          </div>
        {/if}
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
      <div class="min-h-[60px] rounded border border-gray-200 bg-white p-3">
        <NodeViewContent class="prose focus:outline-none" />
      </div>

      <div class="mt-3 flex justify-end">
        <Button
          variant={submitted ? "secondary" : "default"}
          size="sm"
          onclick={handleSubmit}
        >
          {#if submitted}
            <Check class="mr-1 size-4" />
            Submitted - Click to Resubmit
          {:else}
            <Send class="mr-1 size-4" />
            Submit for Review
          {/if}
        </Button>
      </div>
    </CardContent>
  </Card>
</NodeViewWrapper>
