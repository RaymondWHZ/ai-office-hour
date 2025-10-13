<script lang="ts">
  interface Props {
    message: string;
    ondismiss?: () => void;
  }

  let { message, ondismiss }: Props = $props();
</script>

<div
  class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4"
>
  <div class="flex items-start gap-3 flex-1">
    <svg
      class="size-5 text-red-600 shrink-0"
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
    <p class="text-red-900 text-sm m-0 leading-normal">{message}</p>
  </div>
  {#if ondismiss}
    <button
      class="p-0 bg-transparent border-none cursor-pointer text-red-600 size-5 shrink-0 hover:text-red-900"
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
