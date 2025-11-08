<script lang="ts">
  interface Props {
    message: string;
    ondismiss?: () => void;
  }

  let { message, ondismiss }: Props = $props();
</script>

<div
  class="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
>
  <div class="flex flex-1 items-start gap-3">
    <svg
      class="size-5 shrink-0 text-red-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
    <p class="m-0 text-sm leading-normal text-red-900">{message}</p>
  </div>
  {#if ondismiss}
    <button
      class="size-5 shrink-0 cursor-pointer border-none bg-transparent p-0 text-red-600 hover:text-red-900"
      onclick={ondismiss}
      aria-label="Dismiss"
    >
      <svg
        class="size-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    </button>
  {/if}
</div>
