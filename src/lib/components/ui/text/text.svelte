<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { type VariantProps, tv } from "tailwind-variants";

  export const textVariants = tv({
    base: "",
    variants: {
      as: {
        p: "text-base",
        li: "text-base",
        a: "text-base hover:underline underline-offset-4",
        h1: "text-4xl lg:text-5xl font-bold tracking-tight",
        h2: "text-3xl lg:text-4xl font-semibold tracking-tight",
        h3: "text-2xl font-semibold tracking-tight",
        h4: "text-xl font-semibold tracking-tight",
        h5: "text-lg font-medium",
        h6: "text-base font-medium",
      },
    },
    defaultVariants: {
      as: "p",
    },
  });

  export type TextAs = VariantProps<typeof textVariants>["as"];

  export type TextProps = WithElementRef<HTMLAttributes<HTMLElement>> & {
    as?: TextAs;
    class?: string;
  };
</script>

<script lang="ts">
  let {
    class: className,
    as = "p",
    children,
    ref = $bindable(null),
    ...restProps
  }: TextProps = $props();
</script>

<svelte:element
  this={as}
  class={cn(textVariants({ as }), className)}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
