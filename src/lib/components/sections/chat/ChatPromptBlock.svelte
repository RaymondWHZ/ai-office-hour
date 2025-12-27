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
  import type { PromptData } from "$lib/tools";

  interface Props {
    data: PromptData;
    isActive?: boolean;
    isLastMessage?: boolean;
    onSuccess: (answer: string) => void;
  }

  let {
    data = $bindable(),
    isActive = false,
    isLastMessage = false,
    onSuccess,
  }: Props = $props();

  // Local UI state
  let errorHint = $state<string | undefined>(undefined);
  let submitting = $state(false);

  // Derived states from output.state
  const isSuccess = $derived(data.state === "success");
  const isError = $derived(data.state === "error");
  const isDismissed = $derived(data.state === "dismissed");

  // Card styling based on state
  const cardClass = $derived.by(() => {
    if (isSuccess) return "border-success bg-success/10";
    if (isError) return "border-destructive bg-destructive/10";
    if (submitting) return "border-muted-foreground bg-muted";
    return "border-info bg-info/10";
  });

  // For single-choice, data.answer stores the value (for selection tracking)
  // We convert to label for display on success
  const selectChoice = (value: string) => {
    if (submitting || isSuccess) return;
    data.answer = value;
  };

  // Get the display answer (for single-choice: convert value to label)
  const getDisplayAnswer = (): string => {
    if (data.type === "text") {
      return data.answer;
    } else {
      const selectedOption = data.options?.find((o) => o.value === data.answer);
      return selectedOption?.label || data.answer;
    }
  };

  const canSubmit = $derived.by(() => {
    if (submitting || isSuccess) return false;
    return data.answer.trim().length > 0;
  });

  // Evaluate single-choice answers locally using the correct/hint metadata
  const evaluateChoiceAnswer = (): { success: boolean; hint?: string } => {
    if (!data.options) return { success: false, hint: "No options available." };

    if (!data.answer) {
      return { success: false, hint: "Please select an option." };
    }

    const selectedOption = data.options.find(
      (option) => option.value === data.answer,
    );

    if (selectedOption?.correct) {
      return { success: true };
    } else {
      return {
        success: false,
        hint: selectedOption?.hint || "That's not quite right. Try again!",
      };
    }
  };

  const handleSubmit = async () => {
    const answer = data.answer.trim();
    if (!answer) return;

    submitting = true;
    errorHint = undefined;

    // For choice questions, evaluate locally
    if (data.type !== "text" && data.options) {
      const result = evaluateChoiceAnswer();

      if (result.success) {
        data.state = "success";
        onSuccess(getDisplayAnswer());
      } else {
        data.state = "error";
        errorHint = result.hint || "That's not quite right. Try again!";
      }
      submitting = false;
      return;
    }

    // For text questions, call the review API
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: data.question,
          answer,
          correctAnswer: data.correctAnswer,
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        data.state = "success";
        onSuccess(answer);
      } else {
        data.state = "error";
        errorHint = result.hint;
      }
    } catch {
      data.state = "error";
      errorHint = "Failed to review your answer. Please try again.";
    } finally {
      submitting = false;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };
</script>

{#if isDismissed}
  <Card
    class="flex flex-row items-center justify-between gap-3 border-border bg-muted"
  >
    <span class="text-sm text-muted-foreground">Question skipped</span>
    {#if isLastMessage}
      <Button variant="ghost" size="sm" onclick={() => (data.state = "")}>
        <RotateCcw class="mr-1 size-4" />
        Undo
      </Button>
    {/if}
  </Card>
{:else}
  <Card class="relative w-full {cardClass}">
    {#if !isSuccess && isActive}
      <button
        class="absolute top-2 right-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        onclick={() => (data.state = "dismissed")}
        title="Skip this question"
      >
        <X class="size-4" />
      </button>
    {/if}

    <CardHeader class="pr-10 pb-2">
      <div class="flex items-start gap-2">
        {#if isSuccess}
          <CircleCheck class="mt-0.5 size-5 shrink-0 text-success" />
        {:else if submitting}
          <LoaderCircle
            class="mt-0.5 size-5 shrink-0 animate-spin text-muted-foreground"
          />
        {:else if isError}
          <CircleX class="mt-0.5 size-5 shrink-0 text-destructive" />
        {/if}
        <div class="flex-1">
          <div class="text-base font-semibold">
            <Markdown value={data.question} />
          </div>
          {#if isSuccess}
            <div class="text-sm text-success">Correct!</div>
          {:else if isError}
            <div class="text-sm text-destructive">Try again</div>
          {:else if submitting}
            <div class="text-sm text-muted-foreground">Reviewing...</div>
          {/if}
        </div>
      </div>
    </CardHeader>

    <CardContent class="pt-0">
      {#if (data.hint && !isSuccess) || errorHint}
        <div
          class="mb-3 flex items-start gap-2 rounded border border-warning bg-warning/10 p-2 text-sm text-warning-foreground"
        >
          <Lightbulb class="mt-0.5 size-4 shrink-0" />
          <span><Markdown value={errorHint || data.hint || ""} /></span>
        </div>
      {/if}

      {#if isSuccess}
        <!-- Show the answer that was submitted -->
        <div class="rounded border border-success bg-success/10 p-3">
          <Markdown value={getDisplayAnswer()} />
        </div>
      {:else if data.type === "text"}
        <!-- Text input -->
        <Textarea
          bind:value={data.answer}
          onkeydown={handleKeyDown}
          placeholder="Type your answer..."
          disabled={submitting || !isActive}
          class="min-h-20"
        />
      {:else}
        <!-- Choice options -->
        <div class="flex flex-wrap gap-2">
          {#each data.options || [] as option (option.value)}
            {@const isSelected = data.answer === option.value}
            <button
              class="rounded-md border px-4 py-2 text-left transition-colors
                {isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:border-muted-foreground hover:bg-muted'}
                {submitting || !isActive
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'}"
              onclick={() => selectChoice(option.value)}
              disabled={submitting || !isActive}
            >
              <Markdown value={option.label} />
            </button>
          {/each}
        </div>
      {/if}

      {#if !isSuccess && isActive}
        <div class="mt-3 flex justify-end">
          <Button
            variant={isError ? "secondary" : "default"}
            size="sm"
            onclick={handleSubmit}
            disabled={!canSubmit}
          >
            {#if submitting}
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
