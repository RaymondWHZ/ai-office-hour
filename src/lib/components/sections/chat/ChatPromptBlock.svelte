<script lang="ts">
  import { Card, CardHeader, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import Markdown from "$lib/components/renderers/Markdown.svelte";
  import {
    X,
    Send,
    CircleCheck,
    CircleX,
    Lightbulb,
    LoaderCircle,
    RotateCcw,
  } from "@lucide/svelte";
  import type { PromptStudentInput, ChoiceOption } from "$lib/tools";

  interface PromptOutput {
    success: boolean;
    answer?: string;
    dismissed?: boolean;
  }

  interface Props {
    input: PromptStudentInput;
    output?: PromptOutput;
    toolState?: string;
    conversationContext: string;
    canUndo?: boolean;
    onComplete: (output: PromptOutput, continueMessage?: string) => void;
  }

  let {
    input,
    output,
    toolState,
    conversationContext,
    canUndo = true,
    onComplete,
  }: Props = $props();

  // Local UI state
  let textAnswer = $state("");
  let selectedChoices = $state<Set<string>>(new Set());
  let localStatus = $state<"pending" | "loading" | "error">("pending");
  let errorHint = $state<string | undefined>(undefined);

  // Derived states
  const isCompleted = $derived(output?.success === true);
  const isDismissed = $derived(output?.dismissed === true);
  const isStreaming = $derived(toolState === "input-streaming");
  const isLoading = $derived(localStatus === "loading");
  const isError = $derived(localStatus === "error");

  // Card styling based on status
  const cardClass = $derived.by(() => {
    if (isCompleted) return "border-green-500 bg-green-50";
    if (isDismissed) return "border-gray-300 bg-gray-50";
    if (isError) return "border-red-400 bg-red-50";
    if (isLoading) return "border-gray-400 bg-gray-50";
    return "border-blue-400 bg-blue-50";
  });

  const toggleChoice = (value: string) => {
    if (isLoading || isCompleted || isDismissed) return;

    if (input.type === "single-choice") {
      selectedChoices = new Set([value]);
    } else {
      const newSet = new Set(selectedChoices);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      selectedChoices = newSet;
    }
  };

  const getAnswer = (): string => {
    if (input.type === "text") {
      return textAnswer.trim();
    } else {
      const selectedOptions = input.options?.filter((o) =>
        selectedChoices.has(o.value),
      );
      return selectedOptions?.map((o) => o.value).join(", ") || "";
    }
  };

  const canSubmit = $derived.by(() => {
    if (isLoading || isCompleted || isDismissed) return false;
    if (input.type === "text") {
      return textAnswer.trim().length > 0;
    } else {
      return selectedChoices.size > 0;
    }
  });

  const handleSubmit = async () => {
    const answer = getAnswer();
    if (!answer) return;

    localStatus = "loading";
    errorHint = undefined;

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input.question,
          answer,
          conversationContext,
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        localStatus = "pending";
        onComplete(
          { success: true, answer },
          `[Student answered correctly: ${answer}]\n\nPlease continue with the explanation.`,
        );
      } else {
        localStatus = "error";
        errorHint = result.hint;
      }
    } catch {
      localStatus = "error";
      errorHint = "Failed to review your answer. Please try again.";
    }
  };

  const handleDismiss = () => {
    onComplete({ success: false, dismissed: true });
  };

  const handleUndoDismiss = () => {
    // Reset to pending state
    localStatus = "pending";
    errorHint = undefined;
    onComplete({ success: false, dismissed: false });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };
</script>

{#if isStreaming}
  <Card class="flex flex-row items-center gap-3">
    <LoaderCircle class="size-5 animate-spin text-gray-500" />
    <span class="font-medium">Setting up question...</span>
  </Card>
{:else if isDismissed}
  <Card class="flex flex-row items-center justify-between gap-3 {cardClass}">
    <span class="text-sm text-gray-500">Question skipped</span>
    {#if canUndo}
      <Button variant="ghost" size="sm" onclick={handleUndoDismiss}>
        <RotateCcw class="mr-1 size-4" />
        Undo
      </Button>
    {/if}
  </Card>
{:else}
  <Card class="relative w-full {cardClass}">
    {#if !isCompleted}
      <button
        class="absolute top-2 right-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        onclick={handleDismiss}
        title="Skip this question"
      >
        <X class="size-4" />
      </button>
    {/if}

    <CardHeader class="pr-10 pb-2">
      <div class="flex items-start gap-2">
        {#if isCompleted}
          <CircleCheck class="mt-0.5 size-5 shrink-0 text-green-600" />
        {:else if isLoading}
          <LoaderCircle
            class="mt-0.5 size-5 shrink-0 animate-spin text-gray-500"
          />
        {:else if isError}
          <CircleX class="mt-0.5 size-5 shrink-0 text-red-500" />
        {/if}
        <div class="flex-1">
          <div class="text-base font-semibold text-gray-800">
            <Markdown value={input.question} />
          </div>
          {#if isCompleted}
            <div class="text-sm text-green-700">Correct!</div>
          {:else if isError}
            <div class="text-sm text-red-600">Try again</div>
          {:else if isLoading}
            <div class="text-sm text-gray-500">Reviewing...</div>
          {/if}
        </div>
      </div>
    </CardHeader>

    <CardContent class="pt-0">
      {#if (input.hint && !isCompleted) || errorHint}
        <div
          class="mb-3 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800"
        >
          <Lightbulb class="mt-0.5 size-4 shrink-0" />
          <span><Markdown value={errorHint || input.hint || ""} /></span>
        </div>
      {/if}

      {#if isCompleted}
        <!-- Show the answer that was submitted -->
        <div
          class="rounded border border-green-200 bg-green-50 p-3 text-gray-700"
        >
          <Markdown value={output?.answer || ""} />
        </div>
      {:else if input.type === "text"}
        <!-- Text input -->
        <Textarea
          bind:value={textAnswer}
          onkeydown={handleKeyDown}
          placeholder="Type your answer..."
          disabled={isLoading}
          class="min-h-[80px]"
        />
      {:else}
        <!-- Choice options -->
        <div class="flex flex-wrap gap-2">
          {#each input.options || [] as option}
            {@const isSelected = selectedChoices.has(option.value)}
            <button
              class="rounded-md border-2 px-4 py-2 text-left transition-colors
                {isSelected
                ? 'border-blue-500 bg-blue-100 text-blue-800'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}
                {isLoading
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'}"
              onclick={() => toggleChoice(option.value)}
              disabled={isLoading}
            >
              <Markdown value={option.label} />
            </button>
          {/each}
        </div>
      {/if}

      {#if !isCompleted}
        <div class="mt-3 flex justify-end">
          <Button
            variant={isError ? "secondary" : "default"}
            size="sm"
            onclick={handleSubmit}
            disabled={!canSubmit}
          >
            {#if isLoading}
              <LoaderCircle class="mr-1 size-4 animate-spin" />
              Checking...
            {:else if isError}
              <Send class="mr-1 size-4" />
              Try Again
            {:else}
              <Send class="mr-1 size-4" />
              Submit
            {/if}
          </Button>
        </div>
      {/if}
    </CardContent>
  </Card>
{/if}
