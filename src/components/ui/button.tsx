import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary/80",
        outline:
          "bg-transparent text-foreground border-2 border-border hover:bg-secondary",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary",
        destructive:
          "bg-destructive text-primary-foreground hover:bg-destructive/90",
        link: "text-foreground underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 rounded-xl",
        sm: "h-8 px-3 py-1.5 rounded-lg text-xs",
        lg: "h-10 px-6 py-2.5 rounded-xl",
        icon: "size-9 rounded-xl",
        "icon-sm": "size-7 rounded-lg",
        "icon-xs": "size-6 rounded-md"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
