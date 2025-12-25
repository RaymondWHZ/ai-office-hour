<script lang="ts" module>
  import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
  import { type VariantProps, tv } from "tailwind-variants";
  import type { HTMLAttributes } from "svelte/elements";

  export const loaderVariants = tv({
    base: "flex gap-1",
    variants: {
      variant: {
        default: "[&>div]:bg-primary",
        secondary: "[&>div]:bg-secondary-foreground",
        muted: "[&>div]:bg-muted-foreground",
      },
      size: {
        sm: "[&>div]:size-1.5",
        md: "[&>div]:size-2",
        lg: "[&>div]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  });

  export type LoaderVariant = VariantProps<typeof loaderVariants>["variant"];
  export type LoaderSize = VariantProps<typeof loaderVariants>["size"];
  export type LoaderProps = WithoutChildren<
    WithElementRef<HTMLAttributes<HTMLDivElement>>
  > & {
    variant?: LoaderVariant;
    size?: LoaderSize;
    count?: number;
    duration?: number;
    delayStep?: number;
  };
</script>

<script lang="ts">
  let {
    ref = $bindable(null),
    class: className,
    variant = "default",
    size = "md",
    count = 3,
    duration = 0.5,
    delayStep = 100,
    ...restProps
  }: LoaderProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="loader"
  class={cn(loaderVariants({ variant, size }), className)}
  role="status"
  aria-label="Loading..."
  {...restProps}
>
  {#each Array.from({ length: count }) as _, i}
    <div
      class="animate-bounce rounded-full"
      style="animation-duration: {duration}s; animation-iteration-count: infinite; animation-delay: {i *
        delayStep}ms;"
    ></div>
  {/each}
</div>
